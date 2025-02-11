export interface Point {
    x: number;
    y: number;
  }
  
  export interface Stroke {
    points: Point[];
    type: 'draw' | 'erase';
  }