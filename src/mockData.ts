import { Box, Dog } from './types';

export const mockBoxes: Box[] = [
  { id: 'box-1', name: 'Box A', description: 'Box per cani di taglia grande', x: 100, y: 100, capacity: 3, color: '#fbbf24' },
  { id: 'box-2', name: 'Box B', description: 'Box per cani di taglia media', x: 400, y: 100, capacity: 2, color: '#60a5fa' },
  { id: 'box-3', name: 'Box C', description: 'Box con accesso al giardino', x: 100, y: 300, capacity: 4, color: '#34d399' },
  { id: 'box-4', name: 'Box D', description: 'Box climatizzato', x: 400, y: 300, capacity: 2, color: '#f472b6' },
  { id: 'box-5', name: 'Box E', description: 'Box VIP con cuccia premium', x: 700, y: 200, capacity: 3, color: '#a78bfa' },
];

export const mockDogs: Dog[] = [
  { id: 'dog-1', name: 'Asuna', breed: 'Golden Retriever', box_id: 'box-1' },
  { id: 'dog-2', name: 'Loki', breed: 'Husky', box_id: 'box-1' },
  { id: 'dog-3', name: 'Max', breed: 'Labrador', box_id: 'box-2' },
  { id: 'dog-4', name: 'Bella', breed: 'Beagle', box_id: 'box-3' },
  { id: 'dog-5', name: 'Charlie', breed: 'Bulldog', box_id: 'box-3' },
  { id: 'dog-6', name: 'Luna', breed: 'Poodle', box_id: 'box-4' },
  { id: 'dog-7', name: 'Rocky', breed: 'German Shepherd', box_id: null },
  { id: 'dog-8', name: 'Daisy', breed: 'Corgi', box_id: null },
];
