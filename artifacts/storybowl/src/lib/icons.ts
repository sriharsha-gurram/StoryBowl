// Client-only map from catalog id to lucide icon component.
// Kept out of story-core so the server never imports UI code.
import {
  Apple, Armchair, Baby, Backpack, Banana, Bell, BedDouble, Bike, Bird, Book, Bug, Bus, Cake, Camera, Car, Carrot,
  Castle, Cat, Cherry, Citrus, Clock, Cloud, CloudRain, Coffee, Compass, Cookie, Croissant, Crown, Dog, DoorOpen,
  Egg, Fence, Fish, Flame, Flashlight, Flower, Gift, Glasses, Guitar, House, IceCreamCone, Key, Lamp, Leaf, Luggage,
  Mail, Mailbox, Map, Moon, Mountain, Pencil, Phone, Pizza, Plane, Rabbit, Rainbow, Rocket, Sailboat, School, Snail,
  Snowflake, Squirrel, Star, Store, Sun, Tent, TrainFront, TreePine, Turtle, Umbrella, User, Users, WandSparkles,
  Waves, Wind, Worm, type LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  tree: TreePine, flower: Flower, leaf: Leaf, mountain: Mountain, ocean: Waves, sun: Sun, moon: Moon, star: Star,
  cloud: Cloud, rain: CloudRain, snowflake: Snowflake, rainbow: Rainbow, wind: Wind, flame: Flame,
  dog: Dog, cat: Cat, bird: Bird, fish: Fish, rabbit: Rabbit, turtle: Turtle, snail: Snail, squirrel: Squirrel,
  beetle: Bug, worm: Worm,
  person: User, family: Users, baby: Baby, house: House, castle: Castle, school: School, shop: Store, tent: Tent,
  fence: Fence, mailbox: Mailbox,
  armchair: Armchair, bed: BedDouble, lamp: Lamp, door: DoorOpen, key: Key, clock: Clock, umbrella: Umbrella,
  book: Book, pencil: Pencil, letter: Mail, gift: Gift, camera: Camera, phone: Phone, bell: Bell, backpack: Backpack,
  glasses: Glasses, crown: Crown, "magic-wand": WandSparkles, flashlight: Flashlight, guitar: Guitar,
  apple: Apple, banana: Banana, carrot: Carrot, cherry: Cherry, lemon: Citrus, croissant: Croissant, cake: Cake,
  cookie: Cookie, egg: Egg, coffee: Coffee, pizza: Pizza, "ice-cream": IceCreamCone,
  bicycle: Bike, car: Car, bus: Bus, train: TrainFront, sailboat: Sailboat, airplane: Plane, rocket: Rocket,
  map: Map, compass: Compass, suitcase: Luggage,
};
