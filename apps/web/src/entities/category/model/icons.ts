import {
  Bike,
  Car,
  Cpu,
  Flower2,
  Home,
  Monitor,
  Shirt,
  Smartphone,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';

export const categoryIcons: Record<string, LucideIcon> = {
  electronics: Cpu,
  computers: Monitor,
  phones: Smartphone,
  appliances: WashingMachine,
  auto: Car,
  realty: Home,
  hobby: Bike,
  fashion: Shirt,
  'home-garden': Flower2,
};
