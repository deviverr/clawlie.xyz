import { CropConfig } from '../types';

export const CROPS: Record<string, CropConfig> = {
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    stages: 3,
    growthTime: 10, // Fast for testing (usually minutes)
    harvestYield: 2,
    sellPrice: 5,
    seedPrice: 2,
    season: ['spring', 'summer', 'fall']
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    stages: 4,
    growthTime: 20,
    harvestYield: 3,
    sellPrice: 10,
    seedPrice: 4,
    season: ['summer', 'fall']
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    stages: 3,
    growthTime: 15,
    harvestYield: 1,
    sellPrice: 8,
    seedPrice: 3,
    season: ['spring']
  }
};
