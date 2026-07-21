export interface Invasion {
  id: string;
  node: string;
  faction: string;
  completion: number;
  completed: boolean;
  attackerReward: {
    items: string[];
  };
  defenderReward: {
    items: string[];
  };
}

export interface Fissure {
  id: string;
  node: string;
  missionType: string;
  tier: string;
  expiry: string;
}