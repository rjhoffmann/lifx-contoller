import streamDeck, { action, Action, DidReceiveSettingsEvent, JsonValue, KeyAction, SendToPluginEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from '@elgato/streamdeck';
import { readFileSync } from 'fs';

import { ListResponse } from '../types/lifxClient';
import { GlobalSettings } from '../types/settings';

type ToggleSettings = {
  lifxDeviceId: string;
};

type PluginEventPayload = JsonValue & {
  event: string;
}

@action({ UUID: 'com.rjhoff.lifx-controller.toggle-device' })
export class ToggleDevice extends SingletonAction<ToggleSettings> {
  intervalId: NodeJS.Timeout | null = null;
  currentPowerState: 'off' | 'on' = 'off';

  override async onKeyDown(ev: any): Promise<void> {
    const { lifxApiKey, lifxApiRootUrl } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
    const { lifxDeviceId } = ev.payload.settings;

    const nextPowerState = this.currentPowerState === 'on' ? 'off' : 'on';

    const response = await fetch(`${lifxApiRootUrl}/lights/${lifxDeviceId}/state`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${lifxApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        duration: 1,
        fast: false,
        power: nextPowerState
      }),
    });

    if (response.ok) {
      this.currentPowerState = nextPowerState;
      (ev.action as KeyAction<ToggleSettings>).setState(nextPowerState === 'on' ? 1 : 0);
    } else {
      streamDeck.logger.error('Error fetching from LiFX API', response);
    }
  }

  override async onWillAppear(ev: WillAppearEvent<ToggleSettings>): Promise<void> {
    if (ev.action.controllerType === 'Keypad') {
      const { lifxApiKey, lifxApiRootUrl } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
      const { lifxDeviceId } = ev.payload.settings;

      this.intervalId = setInterval(async () => {
        const headers = { 'Authorization': `Bearer ${lifxApiKey}` };
        const response = await fetch(`${lifxApiRootUrl}/lights/${lifxDeviceId}`, { headers });

        if (response.ok) {
          const lights: ListResponse[] = await response.json();
          if (lights.length > 0) {
            (ev.action as KeyAction<ToggleSettings>).setState(lights[0].power === 'on' ? 1 : 0);
          }
        } else {
          streamDeck.logger.error('Error fetching from LiFX API in interval', response);
        }
      }, 10000);
    }
  }

  override async onWillDisappear(ev: WillDisappearEvent<ToggleSettings>): Promise<void> {
    this.intervalId && clearInterval(this.intervalId);
  }

  override async onSendToPlugin(ev: SendToPluginEvent<PluginEventPayload, ToggleSettings>): Promise<void> {
    streamDeck.logger.info('Received PI event', ev);

    if (ev?.payload?.event === 'getLifxDevices') {
      const { lifxApiKey, lifxApiRootUrl } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
      const headers = { 'Authorization': `Bearer ${lifxApiKey}` };
      const response = await fetch(`${lifxApiRootUrl}/lights/all`, { headers });
      
      if (response.ok) {
        const listResponse: ListResponse[] = await response.json();

        streamDeck.ui.current?.sendToPropertyInspector({
          event: 'getLifxDevices',
          items: listResponse.map((device) => ({
            label: `${device.label} (${device.location.name} | ${device.group.name})`,
            value: device.id,
          })),
        });
      } else {
        streamDeck.logger.error('Error fetching from LiFX API', response);
      }
    }
  }
}