// ============================================
// DriveShare - Seed Data & App State
// ============================================

const APP = {
  currentUser: null,
  cars: [],
  bookings: [],
  favorites: [],
};

// ---------- Sample Users ----------
const USERS = [
  { id: 'u1', name: 'Sarah Johnson', email: 'sarah@example.com', password: 'pass123', avatar: 'SJ', role: 'owner', rating: 4.9, trips: 127, joined: '2024-03-15', verified: true, license: true },
  { id: 'u2', name: 'Mike Chen', email: 'mike@example.com', password: 'pass123', avatar: 'MC', role: 'renter', rating: 4.8, trips: 34, joined: '2024-08-20', verified: true, license: true },
  { id: 'u3', name: 'Emily Davis', email: 'emily@example.com', password: 'pass123', avatar: 'ED', role: 'both', rating: 4.7, trips: 89, joined: '2024-01-10', verified: true, license: true },
  { id: 'u4', name: 'James Wilson', email: 'james@example.com', password: 'pass123', avatar: 'JW', role: 'owner', rating: 4.6, trips: 56, joined: '2024-05-22', verified: true, license: true },
  { id: 'u5', name: 'Lisa Park', email: 'lisa@example.com', password: 'pass123', avatar: 'LP', role: 'renter', rating: 5.0, trips: 12, joined: '2025-01-05', verified: true, license: true },
];

// ---------- Sample Cars ----------
const CARS = [
  {
    id: 'c1',
    ownerId: 'u1',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    type: 'Electric',
    category: 'sedan',
    dailyPrice: 89,
    mileage: '12,500',
    transmission: 'Automatic',
    fuel: 'Electric',
    seats: 5,
    location: 'San Francisco, CA',
    distance: 3.2,
    description: 'Experience the future of driving with this sleek Tesla Model 3. Features Autopilot, premium sound system, and panoramic glass roof. Perfect for tech enthusiasts and eco-conscious travelers. Charged at Supercharger stations for optimal battery health.',
    features: ['Autopilot', 'Premium Sound', 'Panoramic Roof', 'Wireless Charging', 'Climate Control', 'GPS Navigation'],
    rating: 4.9,
    reviewCount: 48,
    trips: 127,
    hostName: 'Sarah Johnson',
    hostAvatar: 'SJ',
    available: true,
    instantBook: true,
    images: ['tesla-model3'],
    availability: generateAvailability(),
  },
  {
    id: 'c2',
    ownerId: 'u4',
    make: 'BMW',
    model: 'X5',
    year: 2023,
    type: 'SUV',
    category: 'suv',
    dailyPrice: 125,
    mileage: '28,000',
    transmission: 'Automatic',
    fuel: 'Gasoline',
    seats: 7,
    location: 'Los Angeles, CA',
    distance: 8.7,
    description: 'Luxury meets performance in this BMW X5. Spacious interior with leather seats, premium Harman Kardon sound, and advanced safety features. Ideal for family road trips or business travel in style.',
    features: ['Leather Seats', 'Harman Kardon Audio', 'Sunroof', 'Parking Sensors', 'Cruise Control', 'Heated Seats'],
    rating: 4.7,
    reviewCount: 32,
    trips: 56,
    hostName: 'James Wilson',
    hostAvatar: 'JW',
    available: true,
    instantBook: false,
    images: ['bmw-x5'],
    availability: generateAvailability(),
  },
  {
    id: 'c3',
    ownerId: 'u3',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    type: 'Sedan',
    category: 'sedan',
    dailyPrice: 55,
    mileage: '8,200',
    transmission: 'Automatic',
    fuel: 'Hybrid',
    seats: 5,
    location: 'Seattle, WA',
    distance: 5.1,
    description: 'Reliable and fuel-efficient Toyota Camry Hybrid. Perfect for daily commutes or weekend getaways. Features Toyota Safety Sense, Apple CarPlay, and exceptional fuel economy of 50+ MPG.',
    features: ['Apple CarPlay', 'Toyota Safety Sense', 'Blind Spot Monitor', 'Backup Camera', 'USB Ports', 'Bluetooth'],
    rating: 4.8,
    reviewCount: 67,
    trips: 89,
    hostName: 'Emily Davis',
    hostAvatar: 'ED',
    available: true,
    instantBook: true,
    images: ['toyota-camry'],
    availability: generateAvailability(),
  },
  {
    id: 'c4',
    ownerId: 'u1',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2024,
    type: 'Luxury',
    category: 'luxury',
    dailyPrice: 145,
    mileage: '5,800',
    transmission: 'Automatic',
    fuel: 'Gasoline',
    seats: 5,
    location: 'San Francisco, CA',
    distance: 3.2,
    description: 'Turn heads with this stunning Mercedes-Benz C-Class. Equipped with MBUX infotainment, ambient lighting, and a whisper-quiet cabin. Available for airport pickups and special occasions.',
    features: ['MBUX System', 'Ambient Lighting', 'Burmester Sound', '360 Camera', 'Keyless Entry', 'Digital Cockpit'],
    rating: 4.9,
    reviewCount: 24,
    trips: 43,
    hostName: 'Sarah Johnson',
    hostAvatar: 'SJ',
    available: true,
    instantBook: false,
    images: ['benz-cclass'],
    availability: generateAvailability(),
  },
  {
    id: 'c5',
    ownerId: 'u4',
    make: 'Ford',
    model: 'Mustang',
    year: 2023,
    type: 'Sports',
    category: 'sports',
    dailyPrice: 110,
    mileage: '15,400',
    transmission: 'Automatic',
    fuel: 'Gasoline',
    seats: 4,
    location: 'Los Angeles, CA',
    distance: 8.7,
    description: 'Feel the roar of American muscle in this Ford Mustang GT. 5.0L V8 engine, Track Mode, and premium Recaro seats. Perfect for weekend thrills along Pacific Coast Highway.',
    features: ['V8 Engine', 'Track Mode', 'Recaro Seats', 'B&O Sound', 'Line Lock', 'Performance Pack'],
    rating: 4.6,
    reviewCount: 41,
    trips: 68,
    hostName: 'James Wilson',
    hostAvatar: 'JW',
    available: true,
    instantBook: true,
    images: ['ford-mustang'],
    availability: generateAvailability(),
  },
  {
    id: 'c6',
    ownerId: 'u3',
    make: 'Honda',
    model: 'CR-V',
    year: 2024,
    type: 'SUV',
    category: 'suv',
    dailyPrice: 65,
    mileage: '6,100',
    transmission: 'Automatic',
    fuel: 'Hybrid',
    seats: 5,
    location: 'Seattle, WA',
    distance: 5.1,
    description: 'Versatile and practical Honda CR-V Hybrid. Generous cargo space, Honda Sensing suite, and excellent fuel economy. Great for families and outdoor adventures in the Pacific Northwest.',
    features: ['Honda Sensing', 'Wireless Charging', 'Power Tailgate', 'Leather Interior', 'All-Wheel Drive', 'Roof Rails'],
    rating: 4.7,
    reviewCount: 55,
    trips: 73,
    hostName: 'Emily Davis',
    hostAvatar: 'ED',
    available: true,
    instantBook: true,
    images: ['honda-crv'],
    availability: generateAvailability(),
  },
  {
    id: 'c7',
    ownerId: 'u1',
    make: 'Porsche',
    model: '911 Carrera',
    year: 2023,
    type: 'Luxury',
    category: 'luxury',
    dailyPrice: 299,
    mileage: '9,300',
    transmission: 'Automatic',
    fuel: 'Gasoline',
    seats: 4,
    location: 'San Francisco, CA',
    distance: 3.2,
    description: 'The ultimate driving experience. This Porsche 911 Carrera delivers breathtaking performance with its twin-turbo flat-six engine. Track-ready yet comfortable for grand touring. Insurance included.',
    features: ['Twin-Turbo Engine', 'Sport Chrono', 'PASM Suspension', 'Bose Audio', 'Sport Exhaust', 'Carbon Ceramic Brakes'],
    rating: 5.0,
    reviewCount: 18,
    trips: 22,
    hostName: 'Sarah Johnson',
    hostAvatar: 'SJ',
    available: true,
    instantBook: false,
    images: ['porsche-911'],
    availability: generateAvailability(),
  },
  {
    id: 'c8',
    ownerId: 'u4',
    make: 'Chevrolet',
    model: 'Tahoe',
    year: 2024,
    type: 'SUV',
    category: 'suv',
    dailyPrice: 135,
    mileage: '11,000',
    transmission: 'Automatic',
    fuel: 'Gasoline',
    seats: 7,
    location: 'Los Angeles, CA',
    distance: 8.7,
    description: 'Full-size SUV for the whole family. The Chevrolet Tahoe offers premium comfort with leather seats, rear entertainment, and towing capacity up to 8,400 lbs. Perfect for road trips.',
    features: ['Leather Seats', 'Rear Entertainment', 'Towing Package', 'Bose Audio', 'Heated Steering', 'Wireless Charging'],
    rating: 4.5,
    reviewCount: 29,
    trips: 41,
    hostName: 'James Wilson',
    hostAvatar: 'JW',
    available: true,
    instantBook: true,
    images: ['chevy-tahoe'],
    availability: generateAvailability(),
  },
  {
    id: 'c9',
    ownerId: 'u3',
    make: 'Subaru',
    model: 'Outback',
    year: 2024,
    type: 'Wagon',
    category: 'sedan',
    dailyPrice: 59,
    mileage: '14,200',
    transmission: 'Automatic',
    fuel: 'Gasoline',
    seats: 5,
    location: 'Portland, OR',
    distance: 12.4,
    description: 'Adventure-ready Subaru Outback with standard AWD. X-MODE for off-road capability, Starlink infotainment, and spacious cargo area. Ideal for mountain and beach adventures.',
    features: ['All-Wheel Drive', 'X-MODE', 'Starlink System', 'Roof Rack', 'EyeSight Safety', 'Cargo Cover'],
    rating: 4.8,
    reviewCount: 38,
    trips: 52,
    hostName: 'Emily Davis',
    hostAvatar: 'ED',
    available: true,
    instantBook: true,
    images: ['subaru-outback'],
    availability: generateAvailability(),
  },
];

// ---------- Sample Bookings ----------
const BOOKINGS = [
  { id: 'b1', carId: 'c1', renterId: 'u2', status: 'completed', startDate: '2025-06-01', endDate: '2025-06-04', total: 356, createdAt: '2025-05-28' },
  { id: 'b2', carId: 'c3', renterId: 'u5', status: 'active', startDate: '2025-07-15', endDate: '2025-07-20', total: 330, createdAt: '2025-07-10' },
  { id: 'b3', carId: 'c5', renterId: 'u2', status: 'pending', startDate: '2025-07-25', endDate: '2025-07-27', total: 330, createdAt: '2025-07-18' },
  { id: 'b4', carId: 'c7', renterId: 'u5', status: 'completed', startDate: '2025-05-10', endDate: '2025-05-12', total: 598, createdAt: '2025-05-05' },
  { id: 'b5', carId: 'c2', renterId: 'u2', status: 'pending', startDate: '2025-07-28', endDate: '2025-08-01', total: 500, createdAt: '2025-07-19' },
];

// ---------- Sample Reviews ----------
const REVIEWS = [
  { id: 'r1', carId: 'c1', userId: 'u2', userName: 'Mike Chen', userAvatar: 'MC', rating: 5, date: '2025-06-05', text: 'Amazing car! Sarah was a fantastic host. The Tesla was spotless and fully charged. Autopilot is a game-changer on the highway. Would definitely rent again!' },
  { id: 'r2', carId: 'c1', userId: 'u5', userName: 'Lisa Park', userAvatar: 'LP', rating: 5, date: '2025-05-20', text: 'Perfect experience from start to finish. Clean car, easy pickup/dropoff, and the host was very responsive. The Model 3 exceeded my expectations.' },
  { id: 'r3', carId: 'c1', userId: 'u3', userName: 'Emily Davis', userAvatar: 'ED', rating: 4, date: '2025-04-12', text: 'Great car, great host. Only minor issue was the range on cold days, but Sarah provided helpful tips. Highly recommend.' },
  { id: 'r4', carId: 'c2', userId: 'u2', userName: 'Mike Chen', userAvatar: 'MC', rating: 5, date: '2025-05-15', text: 'Spacious and powerful. Took the X5 on a family road trip to Yosemite and it was perfect. James was very accommodating with the pickup time.' },
  { id: 'r5', carId: 'c3', userId: 'u5', userName: 'Lisa Park', userAvatar: 'LP', rating: 5, date: '2025-07-16', text: 'Best value rental I have ever had. The Camry Hybrid was incredibly fuel efficient and comfortable. Emily was super easy to work with.' },
  { id: 'r6', carId: 'c5', userId: 'u5', userName: 'Lisa Park', userAvatar: 'LP', rating: 4, date: '2025-06-20', text: 'The Mustang is a blast to drive! Loud and proud. James gave great recs for scenic routes. Only downside is the fuel consumption.' },
  { id: 'r7', carId: 'c7', userId: 'u2', userName: 'Mike Chen', userAvatar: 'MC', rating: 5, date: '2025-05-12', text: 'Bucket list experience! The 911 was immaculate. Sarah handled everything professionally. Worth every penny for a special occasion.' },
];

// ---------- Helper Functions ----------
function generateAvailability() {
  const avail = {};
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    avail[key] = Math.random() > 0.2;
  }
  return avail;
}

function formatPrice(price) {
  return '$' + price.toLocaleString();
}

function formatDate(dateStr) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function getCarById(id) {
  return CARS.find(c => c.id === id);
}

function getUserById(id) {
  return USERS.find(u => u.id === id);
}

function getReviewsForCar(carId) {
  return REVIEWS.filter(r => r.carId === carId);
}

function getBookingsForOwner(ownerId) {
  const ownerCars = CARS.filter(c => c.ownerId === ownerId).map(c => c.id);
  return BOOKINGS.filter(b => ownerCars.includes(b.carId));
}

function getBookingsForRenter(renterId) {
  return BOOKINGS.filter(b => b.renterId === renterId);
}

function calculateTotal(dailyPrice, startDate, endDate, insuranceFee = 15) {
  if (!startDate || !endDate) return { days: 0, subtotal: 0, insurance: 0, total: 0 };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const subtotal = dailyPrice * days;
  const insurance = insuranceFee * days;
  return { days, subtotal, insurance, total: subtotal + insurance };
}

function searchCars({ location, category, minPrice, maxPrice, fuel }) {
  return CARS.filter(car => {
    if (location && !car.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (category && car.category !== category) return false;
    if (minPrice && car.dailyPrice < Number(minPrice)) return false;
    if (maxPrice && car.dailyPrice > Number(maxPrice)) return false;
    if (fuel && car.fuel.toLowerCase() !== fuel.toLowerCase()) return false;
    return true;
  });
}
