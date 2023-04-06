export class PairChange {
  pair: string = '';
  price: number = 0;
  volume: number = 0;
  fees: number = 0;
  token: string = '';

  constructor(init?: Partial<PairChange>) {
    Object.assign(this, init);
  }
}
