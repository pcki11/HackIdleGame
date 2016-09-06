var IdleGame = function(gameSettings, $, _) {
	var log = function(level, msg){
		if(level <= gameSettings.logLevel) {
			console.log(msg);
		}
	};
	var Settings = {
		calculatedTiersStart: {
			// index: 0
			price: 1,
			priceInc: 1,
			profit: 0.02
		},
		factor: function(value, factor, index) {
			return value / ((index + 1) * factor);
		},
		getBaseLog(x, y) {
			return Math.log(y) / Math.log(x);
		},
		tierSettings: function(index){
			var start = this.calculatedTiersStart;
			var result = {};
			start.price = result.price = Math.floor((start.price * 20) + (start.price !=1?start.price * 0.15:0));
			start.priceInc = result.priceInc = 1.15;
			start.profit = result.profit = Math.floor((start.price - Math.sqrt(start.profit)) / 10);
			log(1, start);
			this.calculatedTiersStart = start;
			return result;
		},
		upgrades: function(settings) {
			var editMod = function(settings, modName, value){
				var newMod = value;
				var mod = modName+"Mod";
				if(settings[mod]) {
					settings[mod] += newMod;
				} else {
					settings[mod] = newMod;
				}
				return settings;
			};
			return [
				{
					name:"Price -50%",
					effect: function(settings) {
						return editMod(settings, "price", -0.5);
					},
					enabled: false,
					price: settings.price*50
				},
				{
					name:"Profit +500%",
					effect: function(settings) {
						return editMod(settings, "profit", 5.0);
					},
					enabled: false,
					price: settings.price*2000
				}
			];
		},
		i18n: function(section, index) {
			var i18n_sections = {
				tiers: ["Garbage collector", "Janitor", "Intern", "Unqualified worker", "Programmer", "Manager", "Team leader", "Department director", "CTO", "CEO", "Company president", "Lobbyst", "Senator", "Party leader", "Vice president", "Country president", "UN leader", "Mason memeber", "Mason high priest", "Mason leader", "Mason shadow leader", "Illuminati contact", "Illuminati personal manager", "Illuminati memeber", /*24*/"Illuminati rank 0 memeber", "Illuminati rank 1 memeber", "Illuminati rank 2 memeber", "Illuminati rank 3 memeber", "Illuminati rank 4 memeber", "Illuminati rank 5 memeber", "Illuminati rank 6 memeber", "Illuminati priest", "Illuminati council memeber", /*33*/"Illuminati rank 6 shadow memeber", "Illuminati rank 5 shadow memeber", "Illuminati rank 4 shadow memeber", "Illuminati rank 3 shadow memeber", "Illuminati rank 2 shadow memeber", "Illuminati rank 1 shadow memeber", "Illuminati leader"]
			};
			return i18n_sections[section][index];
		}
	};
	var MoneyFormatter = function(){
		var notations = [
			'k',
			'M',
			'B',
			'T',
			'Qa',
			'Qi',
			'Sx',
			'Sp',
			'Oc',
			'No',
			'Dc',
			'UnD',
			'DoD',
			'TrD',
			'QaD',
			'QiD'
		];
		this.format = function(value) {
			var base = 0, notationValue = '';
			if(value >= 1000 && isFinite(value)) {
				value /= 1000;
				while(Math.round(value) >= 1000 && base < notations.length - 1) {
					value /= 1000;
					base++;
				}
				notationValue = notations[base];
			}
			return "$" + (Math.round(value * 100) / 100) + notationValue;
		};
	};
	var GameTimeFormatter = function() {
		var startingYear = 1985;
		var startingMonth = 0;
		var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		this.format = function(time) {
			var m = time % 12;
			var year = Math.floor(time / 12);
			return months[m] + ", " + (startingYear + year);
		};
	};
	var Updater = function(el, delegateFunc, action) {
		this[delegateFunc] = function(val){
			action(el, val);
		};
	};
	var SimpleMoneyUpdater = function(el, delegateFunc) {
		var formatter = new MoneyFormatter();
		var updater = new Updater(el, delegateFunc, function(el, val) {
			el.innerHTML = formatter.format(val);
		});
		this[delegateFunc] = updater[delegateFunc];
	};
	var TimeUpdater = function(el, delegateFunc) {
		var time = -1;
		var timeFormatter = new GameTimeFormatter();
		var updater = new Updater(el, delegateFunc, function(el, val) {
			time++;
			el.innerHTML = timeFormatter.format(time);
		});
		this[delegateFunc] = updater[delegateFunc];
	}
	var TierSettings = function(index) {
		var self = Settings.tierSettings(index);
		var upgrades = Settings.upgrades(self);
		var defPrice = self.price;
		var priceInc = self.priceInc;
		var currentPrice = self.price;
		var amount = 0;
		var profit = self.profit;
		this.buy = function(){
			currentPrice = Math.floor(currentPrice * priceInc);
			amount++;
		};
		this.getAmount = function(){
			return amount;
		};
		this.getProfit = function(){
			var actualProfit = amount * profit;
			if(self.profitMod) {
				actualProfit += actualProfit * self.profitMod;
			}
			return actualProfit;
		};
		this.getPrice = function(){
			var price = currentPrice;
			if(self.priceMod) {
				price += price * self.priceMod;
			} 
			return price;
		};
		this.getUpgrades = function() {
			return upgrades;
		};
		this.buyUpgrade = function(index){
			var upgrade = upgrades[index];
			if(!!upgrade) {
				upgrade.enabled = true;
				self = upgrade.effect(self);
			}
		};
	};
	var TierUpdater = function(dom, delegateFunc, index, __bank) {
		var sett = new TierSettings(index);
		var formatter = new MoneyFormatter();
		var domObj = {
			createdDom: false,
			texts: [],
			buyButtons: [],
			upgradeButtons: []
		};
		var getDescriptionHTML = function(amount, formattedProfit) {
			var quant = amount > 1 ? "&nbsp;&nbsp;&nbsp;x" + amount : ""; 
			var html = "<h4>[<span style='color:green'>+" + formattedProfit + "/month</span>] " + Settings.i18n("tiers", index) + quant + "</h4>";
			return html;
		};
		var updateEl = function(el, money, price) {
			var upgrades = sett.getUpgrades();
			for(var i in domObj.upgradeButtons) {
				var upgradeButton = domObj.upgradeButtons[i];
				var upgrade = upgrades[i];
				if(upgrade.price <= money && !upgrade.enabled) {
					upgradeButton.disabled = "";
				} else {
					upgradeButton.disabled = "disabled";
				}
			}
			for(var i in domObj.buyButtons) {
				var buyButton = domObj.buyButtons[i];
				buyButton.disabled = (price <= money) ? "" : "disabled";
				buyButton.innerHTML = "Buy [" + formatter.format(sett.getPrice()) + "]";
			}
			for(var i in domObj.texts) {
				domObj.texts[i].innerHTML = getDescriptionHTML(sett.getAmount(), formatter.format(sett.getProfit()));
			}
		};
		var updater = new Updater(domObj, delegateFunc, function(el, val) {
			updateEl(el, val, sett.getPrice());
		});
		var isVisible = false;
		this.shouldAppearForMoney = function(money){
			if(!isVisible) {
				log(4, money+" >= "+sett.getPrice()/2);
				isVisible = money >= sett.getPrice()/2;
				return isVisible;
			}
			return false;
		};
		this.DOM = function(){
			if(domObj.createdDom) {
				return dom;
			}

			var text = _("span", function(el){
				el.innerHTML = getDescriptionHTML(sett.getAmount(), formatter.format(sett.getProfit()));
			});
			domObj.texts.push(text);
			dom.appendChild(text);

			var buyButton = _("button", function(el){
				el.className = "button";
				el.innerHTML = "Buy";
				el.onclick = function() {
					var price = sett.getPrice();
					if(__bank.getMoney() >= price) {
						sett.buy();
						__bank.removeMoney(price);
					}
				};
			});
			domObj.buyButtons.push(buyButton);
			dom.appendChild(buyButton);

			var space = _("span");
			space.innerHTML = "&nbsp;";
			dom.appendChild(space);

			var upgrades = sett.getUpgrades();
			for(var i in upgrades) {
				var upgradeButton = _("button", function(el){
					var upgrade = upgrades[i];
					upgrade.index = i;
					el.className = "button";
					el.innerHTML = upgrade.name + " [" + formatter.format(upgrade.price) + "]";
					el.onclick = function(){
						var price = upgrade.price;
						if(__bank.getMoney() >= price) {
							sett.buyUpgrade(upgrade.index);
							el.innerHTML += "[bought]";
							__bank.removeMoney(upgrade.price);
						}
					};
				});
				domObj.upgradeButtons.push(upgradeButton);
				dom.appendChild(upgradeButton);
			}
			dom.appendChild(_("hr"));

			domObj.createdDom = true;
			return dom;
		};
		this.getProfit = sett.getProfit;
		this[delegateFunc] = updater[delegateFunc];
	};
	var Bank = function(){
		var money = 20;
		var delegates = [];
		var delegateMethods = {
			didUpdatePrice: "didUpdatePrice"
		}
		var notify = function(){
			for(var i in delegates) {
				var delegateFunc = delegates[i][delegateMethods.didUpdatePrice];
				if(typeof(delegateFunc)=="function"){
					delegateFunc(money);
				}
			}
		};
		this.registerDelegate = function(obj) {
			if(typeof(obj[delegateMethods.didUpdatePrice])=="function") {
				delegates.push(obj);
			} else {
				log(1, "wrong bank delegate");
			}
		}
		this.addMoney = function(n) {
			if(!n || n <= 0) {
				log(9, {error: "invalid bank operation"});
			}
			money += n;
			notify();
		};
		this.removeMoney = function(n) {
			if(!n || n <= 0 || n > money) {
				log(9, {error: "invalid bank operation"});
			}
			money -= n;
			notify();	
		};
		this.getMoney = function(formatter) {
			if(formatter) {
				return formatter.format(money);
			}
			return money;
		}
		this.priceUpdateDelegateFunction = function(){
			return delegateMethods.didUpdatePrice;
		}
	};
	var Incremental = function(timeEl, moneyEl, profitEl, tiers){
		var timer = null;
		var tickInterval = 1000;
		var timeUpdater = new TimeUpdater(timeEl, "didTick");
		var bank = new Bank();
		var moneyUpdater = new SimpleMoneyUpdater(moneyEl, bank.priceUpdateDelegateFunction());
		bank.registerDelegate(moneyUpdater);
		var tierUpdaters = [];
		var tiersRoot = $(gameSettings.selectors.tiers);
		for(var i = 0; i < tiers; i++) {
			var tierEl = _("div", function(el) {
				el.id = "tier" + i;
			});
			var tierUpdater = new TierUpdater(tierEl, bank.priceUpdateDelegateFunction(), i, bank);
			bank.registerDelegate(tierUpdater);
			tierUpdaters.push(tierUpdater);
		}
		var calculate = function(){
			var profit = 0;
			for(var i in tierUpdaters){
				profit += tierUpdaters[i].getProfit();
			}
			console.log(profit);
			bank.addMoney(profit);
		};
		var moneyFormatter = new MoneyFormatter();
		var updateUI = function(){
			var money = bank.getMoney();
			var totalProfit = 0;
			for(var i in tierUpdaters) {
				var tierUpdater = tierUpdaters[i];
				if(tierUpdater.shouldAppearForMoney(money)) {
					tiersRoot.appendChild(tierUpdater.DOM());
				}
				totalProfit += tierUpdater.getProfit();
			}
			profitEl.innerHTML = "+" + moneyFormatter.format(totalProfit);
		};
		var tick = function() {
			updateUI();
			calculate();
			timer = setTimeout(tick, tickInterval);
			timeUpdater.didTick();
		};
		this.start = function(){
			if(timer){
				clearTimeout(timer);
			}
			tick();
		};
	};
	var timeEl = $(gameSettings.selectors.time);
	var moneyEl = $(gameSettings.selectors.money);
	var profitEl = $(gameSettings.selectors.profit);
	return new Incremental(timeEl, moneyEl, profitEl, 40);
};