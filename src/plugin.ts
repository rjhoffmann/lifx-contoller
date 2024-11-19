import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { ToggleDevice } from "./actions/toggle-device";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the actions that this plugin supports.
streamDeck.actions.registerAction(new ToggleDevice());

// Finally, connect to the Stream Deck.
streamDeck.connect();
