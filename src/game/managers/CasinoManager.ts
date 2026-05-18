import { EventManager } from '../../core/EventManager';
import { EconomyManager } from './EconomyManager';

export interface Card {
  suit: string;
  rank: string;
  value: number;
}

export class CasinoManager {
  private static instance: CasinoManager;
  private economyManager: EconomyManager;
  private eventManager: EventManager;

  private constructor() {
    this.economyManager = EconomyManager.getInstance();
    this.eventManager = EventManager.getInstance();
  }

  public static getInstance(): CasinoManager {
    if (!CasinoManager.instance) {
      CasinoManager.instance = new CasinoManager();
    }
    return CasinoManager.instance;
  }

  // --- Blackjack ---

  public playBlackjack(bet: number): { playerHand: Card[], dealerHand: Card[], result: string, payout: number } {
    if (this.economyManager.getMoney() < bet) {
        return { playerHand: [], dealerHand: [], result: 'Insufficient Funds', payout: 0 };
    }

    this.economyManager.addMoney(-bet);

    const deck = this.createDeck();
    const playerHand = [this.drawCard(deck), this.drawCard(deck)];
    const dealerHand = [this.drawCard(deck), this.drawCard(deck)];

    let playerValue = this.calculateHandValue(playerHand);
    let dealerValue = this.calculateHandValue(dealerHand);

    // Simple auto-play logic for demo (not interactive hit/stand for now to keep it simple but fully logic-complete)
    while (playerValue < 17) {
        playerHand.push(this.drawCard(deck));
        playerValue = this.calculateHandValue(playerHand);
    }

    if (playerValue > 21) {
        return { playerHand, dealerHand, result: 'Bust!', payout: 0 };
    }

    while (dealerValue < 17) {
        dealerHand.push(this.drawCard(deck));
        dealerValue = this.calculateHandValue(dealerHand);
    }

    let result = '';
    let payout = 0;

    if (dealerValue > 21 || playerValue > dealerValue) {
        result = 'Win!';
        payout = bet * 2;
    } else if (playerValue < dealerValue) {
        result = 'Lose';
        payout = 0;
    } else {
        result = 'Push';
        payout = bet;
    }

    this.economyManager.addMoney(payout);
    return { playerHand, dealerHand, result, payout };
  }

  // --- Roulette ---

  public playRoulette(bet: number, choice: 'red' | 'black' | 'number', numberChoice?: number): { roll: number, color: string, result: string, payout: number } {
    if (this.economyManager.getMoney() < bet) {
        return { roll: -1, color: '', result: 'Insufficient Funds', payout: 0 };
    }

    this.economyManager.addMoney(-bet);

    const roll = Math.floor(Math.random() * 37); // 0-36
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(roll);
    const color = roll === 0 ? 'green' : (isRed ? 'red' : 'black');

    let win = false;
    let payout = 0;

    if (choice === 'red' && color === 'red') win = true;
    else if (choice === 'black' && color === 'black') win = true;
    else if (choice === 'number' && roll === numberChoice) win = true;

    if (win) {
        payout = (choice === 'number') ? bet * 35 : bet * 2;
        this.economyManager.addMoney(payout);
    }

    return { roll, color, result: win ? 'WIN!' : 'LOSE', payout };
  }

  // --- Helpers ---

  private createDeck(): Card[] {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const deck: Card[] = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank);
        if (['J','Q','K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;
        deck.push({ suit, rank, value });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  private drawCard(deck: Card[]): Card {
    return deck.pop()!;
  }

  private calculateHandValue(hand: Card[]): number {
    let value = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter(c => c.rank === 'A').length;
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  }
}
