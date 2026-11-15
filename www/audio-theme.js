/* squid-ink-play audio theme selection — wrapper file, not part of the game.
   Loads via script tag before the first run; squid-ink reads the flag lazily
   inside startMusic(), so this opts the Android build into the
   bubbles-and-sea soundscape (the browser game keeps the playful song).
   The squishy water-blob flap sound plays regardless of theme. */
window.SQUID_INK_AMBIENCE = "ocean";
