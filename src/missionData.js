export const MISSIONS = {
  // --- ORIGINAL MISSIONS (Missions 1-3) ---
  dex: {
    id: "dex",
    npcName: "Dex",
    title: "THE STOLEN CRATE",
    cash: 100,
    respect: 10,
    completeOn: "npc",
    acceptTalk:
      "You took the job. My crate is marked near the diner. Grab it and bring it back to me.",
    busyTalk: "The crate is still by the diner. Yellow mark. Bring it here.",
    waitTalk: "That's my crate! I owe you. Here's $100 and a little respect.",
    doneTalk: "You're alright, streetkid. Stay sharp out there.",
    introTalk:
      "Hey. Someone snatched my crate by the diner. I can't chase them. Talk to me if you want the job.",
    activeObjective: "Collect the marked crate near the diner.",
    returnObjective: "Return the crate to Dex.",
  },
  maya: {
    id: "maya",
    npcName: "Maya",
    title: "MARKET DELIVERY",
    cash: 75,
    respect: 8,
    completeOn: "deliver",
    acceptTalk:
      "Hot delivery. Pick up the marked package near the market, then drop it at the east drop point.",
    busyTalk: "Package first, then the east drop. Don't eat the noodles.",
    waitTalk: "You've got the package. Take it to the marked drop east of here.",
    doneTalk: "Clean run. Come back when you want real market work.",
    introTalk:
      "Noodles, chips, and jobs for fast feet. I need a package moved if you're free.",
    activeObjective: "Collect the marked package near the market.",
    returnObjective: "Deliver the package to the marked drop point.",
  },
  jax: {
    id: "jax",
    npcName: "Jax",
    title: "SCOUTING THE EDGE",
    cash: 150,
    respect: 15,
    completeOn: "npc",
    acceptTalk:
      "Scout the marked point on the south-east edge. Don't start a fight. Then report back.",
    busyTalk: "Still waiting on that scout. South-east edge of the city. Purple mark.",
    waitTalk: "Good eyes. Rival side is stirring. Here's $150. Don't get cocky.",
    doneTalk: "Garage is open if you need a bolt-hole. Stay off their radar.",
    introTalk:
      "Rival district runs hotter engines, but they cheat. I need a scout on the edge if you're in.",
    activeObjective: "Reach the marked scouting point at the city edge.",
    returnObjective: "Return to Jax and report what you saw.",
  },

  // --- NEW MISSIONS (Missions 4-7) ---
  // Mission 4: Midnight Courier ($125, 12 respect)
  courier: {
    id: "courier",
    npcName: "Maya",
    title: "MIDNIGHT COURIER",
    cash: 125,
    respect: 12,
    completeOn: "deliver",
    acceptTalk:
      "Urgent midnight run. High-priority cargo is stashed by Club Nebula. Grab it and rush it across town to Pier 14!",
    busyTalk: "Pickup the midnight cargo outside Club Nebula, then sprint it to Pier 14. Move fast!",
    waitTalk: "You've got the cargo. Take it to the Pier 14 drop point before dawn!",
    doneTalk: "Delivery confirmed. You're the fastest courier in this whole district.",
    introTalk:
      "I have a high-priority midnight delivery across town if your legs are up for it.",
    activeObjective: "Collect the midnight cargo near Club Nebula.",
    returnObjective: "Deliver the midnight cargo to the Pier 14 drop point.",
  },

  // Mission 5: Data Heist ($175, 15 respect)
  heist: {
    id: "heist",
    npcName: "Jax",
    title: "DATA HEIST",
    cash: 175,
    respect: 15,
    completeOn: "npc",
    acceptTalk:
      "We need the Syndicate's weapons telemetry. Infiltrate the terminal in the Bio-Tech Lab, extract the data core, and bring it back.",
    busyTalk: "The encrypted terminal is inside the Bio-Tech Lab. Extract the core and bring it here.",
    waitTalk: "You extracted the data core! Brilliant work. Here's your cut: $175 and 15 respect.",
    doneTalk: "These blueprints give our runners a real fighting chance against Rex.",
    introTalk:
      "The Syndicate is hoarding tech in the lab. If you're willing to take a risk, we can pull off a data heist.",
    activeObjective: "Infiltrate the Bio-Tech Lab and extract the data core.",
    returnObjective: "Return the stolen data core to Jax.",
  },

  // Mission 6: Rival Territory ($200, 18 respect)
  rival_crew: {
    id: "rival_crew",
    npcName: "Dex",
    title: "RIVAL TERRITORY",
    cash: 200,
    respect: 18,
    completeOn: "combat",
    acceptTalk:
      "Rex's rival enforcers are ambushing runners at the border. Head into their turf and defeat 2 syndicate rivals (Ghost, Blaze, or Viper)!",
    busyTalk: "Head into the Rival District and defeat 2 syndicate rivals using SPACE attacks.",
    waitTalk: "You put those syndicate enforcers in their place! Here's $200 cash and 18 respect.",
    doneTalk: "The rival crew knows not to mess with our turf now. You're ruling these blocks.",
    introTalk:
      "Rex's crew is creeping onto our streets. We need to push them back.",
    activeObjective: "Defeat 2 syndicate rivals in Rex's turf (0/2).",
    returnObjective: "Return to Dex after clearing the rivals.",
  },

  // Mission 7: The Informant (Choice A: $100 / 10 rep, Choice B: $50 / 20 rep)
  informant: {
    id: "informant",
    npcName: "Kael",
    title: "THE INFORMANT",
    cash: 100, // Safe deal default; updated dynamically if risky chosen
    respect: 10,
    completeOn: "choice",
    acceptTalk:
      "I have intercepted Syndicate surveillance data. I can give you the safe encrypted ledger, or the raw wiretap on Rex's squad. What's your move?",
    busyTalk: "Choose your deal: [1] Safe deal ($100 / +10 rep) or [2] Risky deal ($50 / +20 rep).",
    waitTalk: "Deal concluded. Watch your back on the streets.",
    doneTalk: "No more intel right now. The Syndicate is hunting whoever leaked this.",
    introTalk:
      "Looking for actionable intel? Step closer. I have two deals on the table.",
    activeObjective: "Choose a deal: [1] Safe Deal ($100/10) or [2] Risky Deal ($50/20).",
    returnObjective: "Deal complete.",
  },
};
