import superagent from 'superagent';

class LiFXApi {
  private apiRoot: string;
  private apiKey: string;

  constructor(apiRoot: string, apiKey: string) {
    this.apiRoot = apiRoot;
    this.apiKey = apiKey;
  }

  async togglePower(deviceId: string, currentPowerState: string): Promise<void> {
    const nextPowerState = currentPowerState === 'on' ? 'off' : 'on';

    await superagent
      .put(`${this.apiRoot}/lights/${deviceId}/state`)
      .set('Authorization', `Bearer ${this.apiKey}`)
      .set('content-type', 'application/json')
      .send({
        duration: 1,
        fast: false,
        power: nextPowerState
      });
  }
}