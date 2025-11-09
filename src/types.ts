export interface Dog {
  id: string;
  name: string;
  breed?: string;
  box_id: string | null;
  owner?: string;
  phone?: string;
  image?: string;
  check_in?: string;
  check_out?: string;
  notes?: string;
}

export interface Box {
  id: string;
  name: string;
  description?: string;
  x: number;
  y: number;
  capacity?: number;
  color?: string;
}

export interface BoxNodeData {
  id: string;
  name: string;
  description?: string;
  color?: string;
  capacity?: number;
  dogs: Dog[];
  isHighlighted: boolean;
  onDogDrop: (dogId: string, targetBoxId: string) => void;
  onDogRemove: (dogId: string) => void;
  onDogEdit: (dogId: string) => void;
  onBoxEdit: (boxId: string) => void;
  onBoxDelete: (boxId: string) => void;
}
