import streamDeck, { action, Action, DidReceiveSettingsEvent, JsonValue, KeyAction, SendToPluginEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from '@elgato/streamdeck';
import { readFileSync } from 'fs';

import { ListResponse, ToggleResponse } from '../types/lifxClient';
import { GlobalSettings } from '../types/settings';
import { validateHeaderName } from 'http';

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

    const response = await fetch(`${lifxApiRootUrl}/lights/${lifxDeviceId}/toggle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lifxApiKey}`,
        'content-type': 'application/json',
      },
    });

    if (response.ok) {
      const { results } = await response.json() as ToggleResponse;
      const resultPowerState = results[0].power as 'off' | 'on';
      this.currentPowerState = resultPowerState;
      (ev.action as KeyAction<ToggleSettings>).setState(resultPowerState === 'on' ? 1 : 0);
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
          const lights = await response.json() as Array<ListResponse>;
          if (lights.length > 0) {
            if (lights[0].product.identifier === 'lifx_switch' && lights[0].relays) {
              (ev.action as KeyAction<ToggleSettings>).setState(lights[0].relays.relays[0].power === 'on' ? 1 : 0);
            } else {
              (ev.action as KeyAction<ToggleSettings>).setState(lights[0].power === 'on' ? 1 : 0);
            }
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
        const listResponse = await response.json() as Array<ListResponse>;

        streamDeck.ui.current?.sendToPropertyInspector({
          event: 'getLifxDevices',
          items: listResponse.map((device) => {
            if (device.product.identifier === 'lifx_switch' && device.relays) {
              return {
                label: `${device.label} (${device.location.name} | ${device.group.name})`,
                children: device.relays.relays.map((relay) => ({
                  label: `${device.label} ${relay.label} (${device.location.name} | ${device.group.name})`,
                  value: `${device.id}|${relay.index}`,
                })),
              }
            }
            return {
              label: `${device.label} (${device.location.name} | ${device.group.name})`,
              value: device.id,
            }
          }),
        });
      } else {
        streamDeck.logger.error('Error fetching from LiFX API', response);
      }
    }
  }
}