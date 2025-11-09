import initSqlJs, { Database } from 'sql.js';
import { Box, Dog } from '../types';

const DB_KEY = 'pawplan_db';

let db: Database | null = null;

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem(DB_KEY);
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    // Create new database
    db = new SQL.Database();
    createTables();
    insertMockData();
  }
}

function createTables(): void {
  if (!db) return;

  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      x REAL NOT NULL,
      y REAL NOT NULL,
      capacity INTEGER,
      color TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dogs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      breed TEXT,
      box_id TEXT,
      owner TEXT,
      phone TEXT,
      image TEXT,
      check_in TEXT,
      check_out TEXT,
      notes TEXT,
      FOREIGN KEY (box_id) REFERENCES boxes(id)
    )
  `);
}

function insertMockData(): void {
  if (!db) return;

  // Insert mock boxes
  const mockBoxes = [
    { id: 'box-1', name: 'Box A', description: 'Box per cani di taglia grande', x: 100, y: 100, capacity: 3, color: '#fbbf24' },
    { id: 'box-2', name: 'Box B', description: 'Box per cani di taglia media', x: 400, y: 100, capacity: 2, color: '#60a5fa' },
    { id: 'box-3', name: 'Box C', description: 'Box con accesso al giardino', x: 100, y: 300, capacity: 4, color: '#34d399' },
    { id: 'box-4', name: 'Box D', description: 'Box climatizzato', x: 400, y: 300, capacity: 2, color: '#f472b6' },
    { id: 'box-5', name: 'Box E', description: 'Box VIP con cuccia premium', x: 700, y: 200, capacity: 3, color: '#a78bfa' },
  ];

  mockBoxes.forEach((box) => {
    db!.run(
      'INSERT INTO boxes (id, name, description, x, y, capacity, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [box.id, box.name, box.description, box.x, box.y, box.capacity, box.color]
    );
  });

  // Insert mock dogs
  const mockDogs = [
    { id: 'dog-1', name: 'Asuna', breed: 'Golden Retriever', box_id: 'box-1' },
    { id: 'dog-2', name: 'Loki', breed: 'Husky', box_id: 'box-1' },
    { id: 'dog-3', name: 'Luna', breed: 'Labrador', box_id: 'box-2' },
    { id: 'dog-4', name: 'Max', breed: 'Pastore Tedesco', box_id: 'box-3' },
    { id: 'dog-5', name: 'Bella', breed: 'Beagle', box_id: 'box-3' },
    { id: 'dog-6', name: 'Charlie', breed: 'Bulldog', box_id: null },
    { id: 'dog-7', name: 'Daisy', breed: 'Poodle', box_id: null },
    { id: 'dog-8', name: 'Rocky', breed: 'Boxer', box_id: 'box-4' },
  ];

  mockDogs.forEach((dog) => {
    db!.run(
      'INSERT INTO dogs (id, name, breed, box_id, owner, phone, image, check_in, check_out, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [dog.id, dog.name, dog.breed, dog.box_id, null, null, null, null, null, null]
    );
  });
}

export function saveToLocalStorage(): void {
  if (!db) return;

  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem(DB_KEY, JSON.stringify(array));
}

export function getBoxes(): Box[] {
  if (!db) return [];

  const result = db.exec('SELECT * FROM boxes');
  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
    description: row[2] as string | undefined,
    x: row[3] as number,
    y: row[4] as number,
    capacity: row[5] as number | undefined,
    color: row[6] as string | undefined,
  }));
}

export function getDogs(): Dog[] {
  if (!db) return [];

  const result = db.exec('SELECT * FROM dogs');
  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
    breed: row[2] as string | undefined,
    box_id: row[3] as string | null,
    owner: row[4] as string | undefined,
    phone: row[5] as string | undefined,
    image: row[6] as string | undefined,
    check_in: row[7] as string | undefined,
    check_out: row[8] as string | undefined,
    notes: row[9] as string | undefined,
  }));
}

export function addBox(box: Box): void {
  if (!db) return;

  db.run(
    'INSERT INTO boxes (id, name, description, x, y, capacity, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [box.id, box.name, box.description || null, box.x, box.y, box.capacity || null, box.color || null]
  );
}

export function updateBox(box: Box): void {
  if (!db) return;

  db.run(
    'UPDATE boxes SET name = ?, description = ?, x = ?, y = ?, capacity = ?, color = ? WHERE id = ?',
    [box.name, box.description || null, box.x, box.y, box.capacity || null, box.color || null, box.id]
  );
}

export function deleteBox(id: string): void {
  if (!db) return;

  // First, unassign all dogs from this box
  db.run('UPDATE dogs SET box_id = NULL WHERE box_id = ?', [id]);

  // Then delete the box
  db.run('DELETE FROM boxes WHERE id = ?', [id]);
}

export function addDog(dog: Dog): void {
  if (!db) return;

  db.run(
    'INSERT INTO dogs (id, name, breed, box_id, owner, phone, image, check_in, check_out, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [dog.id, dog.name, dog.breed || null, dog.box_id || null, dog.owner || null, dog.phone || null, dog.image || null, dog.check_in || null, dog.check_out || null, dog.notes || null]
  );
}

export function updateDog(dog: Dog): void {
  if (!db) return;

  db.run(
    'UPDATE dogs SET name = ?, breed = ?, box_id = ?, owner = ?, phone = ?, image = ?, check_in = ?, check_out = ?, notes = ? WHERE id = ?',
    [dog.name, dog.breed || null, dog.box_id || null, dog.owner || null, dog.phone || null, dog.image || null, dog.check_in || null, dog.check_out || null, dog.notes || null, dog.id]
  );
}

export function updateDogBoxId(dogId: string, boxId: string | null): void {
  if (!db) return;

  db.run('UPDATE dogs SET box_id = ? WHERE id = ?', [boxId, dogId]);
}

export function deleteDog(id: string): void {
  if (!db) return;

  db.run('DELETE FROM dogs WHERE id = ?', [id]);
}

export function updateBoxPosition(id: string, x: number, y: number): void {
  if (!db) return;

  db.run('UPDATE boxes SET x = ?, y = ? WHERE id = ?', [x, y, id]);
}
