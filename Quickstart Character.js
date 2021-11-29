//Version 1.00
//Initial Script to use Quickstart character rules from M&M 3e Core Book

on("chat:message", function (msg) {
	if (msg.type == "api" && msg.content.indexOf("!Quickstart") == 0) {
			//Must have a token selected
		var selected = msg.selected;
		if (selected === undefined) {
			sendChat("Quickstart", "Please select a character token.");
			return;
		};

			//selected token 
		var token = getObj("graphic", selected[0]._id);
		var character = getObj("character", token.get("represents"));

		if (character === undefined) {
			sendChat("Quickstart", "Please make certain a character is assigned to this token.");
			return;
		};

		var args = msg.content.split(/\s+/);
		var randomOrNot = args[1].replace('--', '');

			//Function to roll on table in game via Kurt J.
		function rollOnRollableTable(tableName) {
			var theTable = findObjs({ type: "rollabletable", name: tableName })[0];
			if (theTable !== undefined) {
				var tableItems = findObjs({ type: "tableitem", _rollabletableid: theTable.id });
				if (tableItems !== undefined) {
					var rollResults = {};
					var rollIndex = 0;
					var lastRollIndex = 0;
					var itemCount = 0;
					var maxRoll = 0;
					tableItems.forEach(function (item) {
						var thisWeight = parseInt(item.get("weight"));
						rollIndex += thisWeight;
						for (var x = lastRollIndex + 1; x <= rollIndex; x++) {
							rollResults[x] = itemCount;
						}
						itemCount += 1;
						maxRoll += thisWeight;
						lastRollIndex += thisWeight;
					});
					var tableRollResult = randomInteger(maxRoll);
					return [tableItems[rollResults[tableRollResult]].get("name"), tableItems[rollResults[tableRollResult]].get("avatar")];
				} else {
					return ["", ""];
				}
			}
		};
			//End roll on table function



			//Row IDs needed for all the repeating rows in the sheet, use as neccessary per row. Function stolen shamelessly from The Aaron
		var generateUUID = (function () {
			"use strict";

			var a = 0, b = [];
			return function () {
				var c = (new Date()).getTime() + 0, d = c === a;
				a = c;
				for (var e = new Array(8), f = 7; 0 <= f; f--) {
					e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
					c = Math.floor(c / 64);
				}
				c = e.join("");
				if (d) {
					for (f = 11; 0 <= f && 63 === b[f]; f--) {
						b[f] = 0;
					}
					b[f]++;
				} else {
					for (f = 0; 12 > f; f++) {
						b[f] = Math.floor(64 * Math.random());
					}
				}
				for (f = 0; 12 > f; f++) {
					c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
				}
				return c;
			};
		}()),

			generateRowID = function () {
				"use strict";
				return generateUUID().replace(/_/g, "Z");
			};
			//End Row ID function

			//Proper Case if needed	
		function toProperCase(s) {
			let parts = s.split(" ");
			let sb = [];

			for (i = 0; i < parts.length; i++) {
				if (parts[i] != 'of') {
					sb.push(parts[i].substring(0, 1).toUpperCase() + parts[i].substring(1).toLowerCase() + ' ');
				} else {
					sb.push(parts[i] + ' ');
				};
			};
			return sb.join(' ').toString().trim();
		};
			//End Proper Case function

			//Object creation function
		const createAttribute = (name, value) => {
			if (value == undefined || value == null) {
				log(`Quickstart: no value found for ${name}, skipping create.`);
				return;
			};

			var existingAttribute = findObjs({ type: 'attribute', characterid: character.id, name: name })[0];
			if (!existingAttribute) {
				createObj('attribute', {
					name: name,
					current: value,
					characterid: character.id
				});
				log(`Quickstart: creating ${name} with a value of ${value}`);
				return;
			};

			var existingAttributeValue = existingAttribute.get('current')
			if (existingAttributeValue == value) {
				log(`Quickstart: ${name} already exists as ${value}, skipping create.`);
			} else {
				setAttrs(character.id, { name: value })
			};
		};
			//End function

			//Generate Archetype
		if (randomOrNot == "roll" || randomOrNot === undefined || randomOrNot === null) {
			var archetype = rollOnRollableTable("RandomArchetype")
			archetype = archetype[0].toLowerCase()
		} else {
			var archetype = randomOrNot.toLowerCase()
		};


			//Battlesuit
		if (archetype == "battlesuit") {
				//Abilities
			var battlesuitAbilites = rollOnRollableTable("BattlesuitAbilities")
			var abilities = battlesuitAbilites[0].split("/")
			var abilityName = abilities[0]
			let attributeArray = ["blank", "strength_rank", "stamina_rank", "agility_rank", "dexterity_rank", "fighting_rank", "intellect_rank", "awareness_rank", "presence_rank"]
			let miscArray = ["blank", "strength_misc", "stamina_misc", "agility_misc", "dexterity_misc", "fighting_misc", "intellect_misc", "awareness_misc", "presence_misc"]
			let modArray = ["blank", "strength_mod", "stamina_mod", "agility_mod", "dexterity_mod", "fighting_mod", "intellect_mod", "awareness_mod", "presence_mod"]

			for (i = 1; i < attributeArray.length; i++) {
				createAttribute(attributeArray[i], abilities[i])
				createAttribute(miscArray[i], "0")
				createAttribute(modArray[i], "0")
			};

				//Advantages
			var battlesuitAdvantages1 = rollOnRollableTable("BattlesuitAdvantages")
			var battlesuitAdvantages2 = rollOnRollableTable("BattlesuitAdvantages")

			for (i = 0; 20; i++) {
				if (battlesuitAdvantages1[0] == battlesuitAdvantages2[0]) {
					battlesuitAdvantages2 = rollOnRollableTable("BattlesuitAdvantages")
				} else {
					break;
				};
			};

			let advantageArray = [battlesuitAdvantages1[0], battlesuitAdvantages2[0]]
			var advantages = advantageArray.toString()
			advantages = advantages.split(", ")

			for (i = 0; i < advantages.length; i++) {
				let advantageRowID = generateRowID()
				createAttribute("repeating_advantages_" + advantageRowID + "_name", advantages[i])
			};

			//Skills
			var battlesuitSkills1 = rollOnRollableTable("BattlesuitSkills")
			var battlesuitSkills2 = rollOnRollableTable("BattlesuitSkills")

			let combinedArray = [battlesuitSkills1[0], battlesuitSkills2[0]]
			let stringArray = combinedArray.toString()
			let rollArray = stringArray.split(",")
			let doneArray = []

			for (i = 0; i < rollArray.length; i++) {
				var skillArrayEntry = rollArray[i]

				if (!skillArrayEntry.indexOf("Expertise")) {
					expertiseRowID = generateRowID()
					expertiseEntry = skillArrayEntry.split(": ")
					expertiseEntrySplit = expertiseEntry[1].split(" ")
					expertiseName = expertiseEntrySplit[0]
					expertiseRank = expertiseEntrySplit[1]
					createAttribute("repeating_expertise_" + expertiseRowID + "_expertise_name", expertiseName)
					createAttribute("repeating_expertise_" + expertiseRowID + "_expertise_rank", expertiseRank)
				} else {
					skillEntry = skillArrayEntry.split(" ")
					skillName = skillEntry[0].toLowerCase() + "_rank"
					skillRank = skillEntry[1]
					if (skillEntry[0] == "Sleight") {
						skillName = "sleightofhand_rank"
						skillRank = skillEntry[3]
					};
					createAttribute(skillName, skillRank)
				};

			};

			//Offensive Powers
			//Create Weapons Array
			masterRowID = generateRowID()
			createAttribute("repeating_powers_" + masterRowID + "_label", "Weapons Array")
			createAttribute("repeating_powers_" + masterRowID + "_element_type", "power")
			createAttribute("repeating_powers_" + masterRowID + "_description", "Array")

			plasmaRowID = generateRowID()
			createAttribute("repeating_powers_" + plasmaRowID + "_label", "Plasma Blast")
			createAttribute("repeating_powers_" + plasmaRowID + "_master_row", masterRowID)
			createAttribute("repeating_powers_" + plasmaRowID + "_attack_type", "alternative")
			createAttribute("repeating_powers_" + plasmaRowID + "_element_type", "attack_fx ")
			createAttribute("repeating_powers_" + plasmaRowID + "_rank", "10")
			createAttribute("repeating_powers_" + plasmaRowID + "_description", "Ranged Damage 10, Accurate 4")

			//roll additional Array powers
			power1 = rollOnRollableTable("BattlesuitOffensivePowers")
			power2 = rollOnRollableTable("BattlesuitOffensivePowers")
			power3 = rollOnRollableTable("BattlesuitOffensivePowers")
			power4 = rollOnRollableTable("BattlesuitOffensivePowers")



			let powers = [power1[0], power2[0], power3[0], power4[0]];

			for (i = 0; i < powers.length; i++) {
				let powerEntry = powers[i].split("/")
				for (j = 0; j < powerEntry.length; j++) {
					let splitPower = powerEntry[j].split(": ")
					let powerRowID = generateRowID()
					createAttribute("repeating_powers_" + powerRowID + "_label", splitPower[0])
					createAttribute("repeating_powers_" + powerRowID + "_master_row", masterRowID)
					createAttribute("repeating_powers_" + powerRowID + "_element_type", "attack_fx")
					createAttribute("repeating_powers_" + powerRowID + "_description", splitPower[1])
				};
			};

			//Defensive Powers
			var def1RowID = generateRowID()
			createAttribute("repeating_powers_" + def1RowID + "_label", "Ability Amplifier")
			createAttribute("repeating_powers_" + def1RowID + "_element_type", "power")
			createAttribute("repeating_powers_" + def1RowID + "_description", "Enhanced Defenses 16 (Dodge 4, Fortitude 4, Parry 4, Will 4), Removable (-3 points)")

			var def2RowID = generateRowID()
			createAttribute("repeating_powers_" + def2RowID + "_label", "Armored Shell")
			createAttribute("repeating_powers_" + def2RowID + "_element_type", "power")
			createAttribute("repeating_powers_" + def2RowID + "_description", "Impervious Protection 8, Removable (-3 points)")

			var def3RowID = generateRowID()
			createAttribute("repeating_powers_" + def3RowID + "_label", "Sealed Systems")
			createAttribute("repeating_powers_" + def3RowID + "_element_type", "power")
			createAttribute("repeating_powers_" + def3RowID + "_description", "Immunity 10 (Life Support), Removable (-2 points)")

			//MovementPower
			var movement = rollOnRollableTable("BattlesuitMovementPowers")
			let movementRoll = movement[0].split("/")

			for (i = 0; i < movementRoll.length; i++) {
				var movementRowID = generateRowID()
				var movementEntry = movementRoll[i].split(": ")
				createAttribute("repeating_powers_" + movementRowID + "_label", movementEntry[0])
				createAttribute("repeating_powers_" + movementRowID + "_element_type", "power")
				createAttribute("repeating_powers_" + movementRowID + "_description", movementEntry[1])
			};
		}; //End Battlesuit

		sendChat("Quickstart Import", `Script Complete, check for import errors.`);

	};
});