export interface Destination {
  /** Display name shown on the globe pin, vote button, and modal. */
  name: string;
  /** [longitude, latitude] in degrees. Used for d3 projection. */
  coords: [number, number];
  /** One-liner shown in the modal when the wheel lands here. */
  line: string;
  /** Hometown badge + scouting-report card render only when true. */
  isHometown?: boolean;
}

export const destinations: Destination[] = [
  {
    name: 'Las Vegas',
    coords: [-115.1398, 36.1699],
    line: 'The classic. The legend. Clay will lose $40 and call it a win.',
  },
  {
    name: 'Portland',
    coords: [-122.6784, 45.5152],
    line: 'Craft beer, vintage cameras, and a man completely in his element.',
  },
  {
    name: 'Yakima',
    coords: [-120.5059, 46.6021],
    line: "You played ball at YVCC. You know exactly what a Friday night in Yakima looks like. And yet here we are.",
    isHometown: true,
  },
  {
    name: "Coeur d'Alene",
    coords: [-116.7805, 47.6777],
    line: 'Lake vibes. Dock jumping. The Jeep stays home.',
  },
];

/** Ordered list of destination names — used by API + client to validate input. */
export const destinationNames = destinations.map((d) => d.name);
