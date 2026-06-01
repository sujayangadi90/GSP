const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Admin = require('./models/Admin');
const ServiceCategory = require('./models/ServiceCategory');
const Service = require('./models/Service');
const Brand = require('./models/Brand');
const Testimonial = require('./models/Testimonial');
const CmsContent = require('./models/CmsContent');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/global_service_point');
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await Admin.deleteMany({});
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    await Brand.deleteMany({});
    await Testimonial.deleteMany({});
    await CmsContent.deleteMany({});

    console.log('Existing data cleared.');

    // 1. Seed Default Admin
    const adminPassword = 'Admin@1234';
    
    await Admin.create({
      email: 'admin@globalservicepoint.com',
      password: adminPassword,
      name: 'Global Service Point Admin'
    });
    console.log('Seeded default Admin: admin@globalservicepoint.com / Admin@1234');

    // 2. Seed Brands
    const brandData = [
      { name: 'LG', logo: '/brands/lg.png', description: 'Life\'s Good', associatedServices: ['Air Conditioner (AC)', 'Refrigerator / Fridge', 'Washing Machine', 'Television (TV)', 'Oven'] },
      { name: 'Samsung', logo: '/brands/samsung.png', description: 'Inspire the World, Create the Future', associatedServices: ['Air Conditioner (AC)', 'Refrigerator / Fridge', 'Washing Machine', 'Television (TV)', 'Oven'] },
      { name: 'Whirlpool', logo: '/brands/whirlpool.png', description: 'Everyday Care', associatedServices: ['Refrigerator / Fridge', 'Washing Machine', 'Oven'] },
      { name: 'IFB', logo: '/brands/ifb.png', description: 'Set Yourself Free', associatedServices: ['Washing Machine', 'Dishwasher', 'Oven', 'Chimney'] },
      { name: 'Bosch', logo: '/brands/bosch.png', description: 'Invented for life', associatedServices: ['Washing Machine', 'Dishwasher', 'Refrigerator / Fridge'] },
      { name: 'Kent', logo: '/brands/kent.png', description: 'House of Purity', associatedServices: ['Home Water Purifier', 'Commercial Water Purifier', 'RO Water Plant'] },
      { name: 'Aquaguard', logo: '/brands/aquaguard.png', description: 'The Copper Charger', associatedServices: ['Home Water Purifier', 'Commercial Water Purifier'] },
      { name: 'Exide', logo: '/brands/exide.png', description: 'Designing the future of power', associatedServices: ['UPS', 'Battery'] },
      { name: 'Luminous', logo: '/brands/luminous.png', description: 'Khushiyon ka ghar', associatedServices: ['UPS', 'Battery'] }
    ];
    const createdBrands = await Brand.insertMany(brandData);
    console.log(`Seeded ${createdBrands.length} Brands.`);

    // 3. Seed Testimonials
    const testimonialData = [
      { name: 'Ramesh Kulkarni', review: 'Excellent service for my LG Air Conditioner. The technician arrived on time, wore a mask, and diagnosed the issue perfectly. Highly recommended!', rating: 5 },
      { name: 'Sneha Patil', review: 'I had water quality issues in Gadag. Global Service Point installed a Kent RO Water Purifier and now we get pure drinking water. Quick support!', rating: 5 },
      { name: 'Basavaraj M.', review: 'Got my battery and inverter installation done from GSP. The team was extremely knowledgeable and suggested the right UPS model for my house loads.', rating: 4 }
    ];
    await Testimonial.insertMany(testimonialData);
    console.log('Seeded testimonials.');

    // 4. Seed Service Categories & Services
    const categories = [
      {
        name: 'Home Appliances',
        slug: 'home-appliances',
        description: 'Professional repair, installation, and maintenance services for all your household appliances.',
        services: [
          { name: 'Air Conditioner (AC)', slug: 'ac-service', shortDescription: 'Premium split and window AC repair, installation, and deep servicing.', serviceTypes: ['Installation', 'Repair', 'Maintenance'], features: ['Chemical foam wash', 'Gas leakage check', 'Compressor repair'], benefits: ['Lower power bills', 'Faster cooling room coverage', 'Extended unit life'] },
          { name: 'Refrigerator / Fridge', slug: 'refrigerator-service', shortDescription: 'Single/Double door and side-by-side refrigerator repair.', serviceTypes: ['Repair', 'Maintenance'], features: ['Thermostat check', 'Cooling coil replacement', 'Gas refilling'], benefits: ['Food fresh longer', 'Reduced power draw', 'Zero noise operation'] },
          { name: 'Oven', slug: 'oven-service', shortDescription: 'Microwave and convection oven repair and services.', serviceTypes: ['Repair', 'Maintenance'], features: ['Magnetron replacement', 'Turntable motor repair', 'Heating issue fix'], benefits: ['Even heating', 'Safe operations', 'Energy efficiency'] },
          { name: 'Washing Machine', slug: 'washing-machine-service', shortDescription: 'Top load, front load, and semi-automatic washing machine repair.', serviceTypes: ['Installation', 'Repair', 'Maintenance'], features: ['Drum balancing', 'Inlet valve replacement', 'PCB board repair'], benefits: ['Fabric care', 'Proper drainage', 'Less detergent waste'] }
        ]
      },
      {
        name: 'Cleaning & Pest Control',
        slug: 'cleaning-pest-control',
        description: 'Top-tier commercial and residential cleaning and pest management solutions.',
        services: [
          { name: 'Cleaning & Pest Control Services', slug: 'pest-control', shortDescription: 'Eco-friendly and certified residential and commercial cleaning and pest control.', serviceTypes: ['Residential Services', 'Commercial Services'], features: ['Non-toxic sprays', 'Deep cleaning machines', 'Termite and bedbug treatment'], benefits: ['Hygienic living space', 'No chemical smells', '100% pest eradication guarantee'] }
        ]
      },
      {
        name: 'Renewable Energy Products',
        slug: 'renewable-energy',
        description: 'Eco-friendly solar solutions for continuous sustainable energy.',
        services: [
          { name: 'Solar Water Heater', slug: 'solar-water-heater', shortDescription: 'Installation and servicing of premium solar water heating systems.', serviceTypes: ['Installation', 'Repair', 'Maintenance'], features: ['High heating retention tanks', 'Premium tubes', 'Rust resistant stands'], benefits: ['Zero electric bills for hot water', 'All-weather performance', 'Eco-friendly hot water'] },
          { name: 'Solar Rooftop System', slug: 'solar-rooftop', shortDescription: 'Turnkey solar rooftop system installation for residential & commercial sites.', serviceTypes: ['Installation', 'Repair', 'Maintenance'], features: ['Premium Mono PERC panels', 'Net-metering setup', 'Grid-tied inverters'], benefits: ['Slash monthly electric bills up to 90%', 'High ROI within 4-5 years', 'Clean solar power generation'] }
        ]
      },
      {
        name: 'Water Solutions',
        slug: 'water-solutions',
        description: 'Complete pure drinking water and water softener systems.',
        services: [
          { name: 'Home Water Purifier', slug: 'home-water-purifier', shortDescription: 'RO, UV, and UF water purifier installation and periodic AMC filters exchange.', serviceTypes: ['Installation', 'Repair', 'Maintenance'], features: ['Multi-stage purification', 'Filter replacements', 'TDS testing'], benefits: ['Pure, pathogen-free water', 'Corrected mineral taste', 'Boosted immunity'] }
        ]
      }
    ];

    let currentOrder = 1;
    for (const cat of categories) {
      const dbCat = await ServiceCategory.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
        order: currentOrder++
      });

      for (const serv of cat.services) {
        await Service.create({
          category: dbCat._id,
          name: serv.name,
          slug: serv.slug,
          shortDescription: serv.shortDescription,
          detailedDescription: `${serv.shortDescription} Our certified professionals handle all popular brands. We use 100% genuine replacement parts and provide warranty on our services. Reach out today for Gadag\'s highest-rated technical team.`,
          serviceTypes: serv.serviceTypes,
          features: serv.features,
          benefits: serv.benefits,
          isActive: true,
          metaTitle: `${serv.name} Repair & Service in Gadag | Global Service Point`,
          metaDescription: `Professional ${serv.name} installation, repair, and maintenance services in Gadag and nearby areas. 100% customer satisfaction guaranteed.`
        });
      }
    }
    console.log('Seeded Service Categories & Services.');

    // 5. Seed CMS Content
    const cmsItems = [
      {
        key: 'header',
        value: {
          logoText: 'Global Service Point',
          phoneNumber: '+91 99000 12345',
          emailAddress: 'info@globalservicepoint.com'
        }
      },
      {
        key: 'footer',
        value: {
          aboutText: 'Global Service Point is Gadag\'s leading service provider for all home appliances, renewable energy products, water purifiers, and commercial cleaning services. Your trusted technical partner.',
          address: 'Main Road, Near Kalasgiri Temple, Gadag - 582101, Karnataka',
          phone: '+91 99000 12345',
          email: 'support@globalservicepoint.com',
          businessHours: 'Mon - Sat: 9:00 AM - 7:00 PM, Sun: Closed'
        }
      },
      {
        key: 'hero',
        value: {
          title: 'Your Trusted Partner for Expert Services',
          subtitle: 'Professional Appliance Repair, Solar Systems, Water Solutions & Cleanings in Gadag & Surrounding Areas.',
          ctaText: 'Enquire Now',
          banners: [
            '/banners/hero-appliance.jpg',
            '/banners/hero-solar.jpg'
          ]
        }
      },
      {
        key: 'about_us',
        value: {
          introTitle: 'Welcome to Global Service Point',
          introText: 'Established in Gadag, Global Service Point has grown into a premium one-stop hub for specialized services. We combine skilled craftsmanship, authentic parts, and swift turnaround times to guarantee maximum appliance and asset lifetime for our domestic and commercial clients.',
          experienceYears: '10+',
          vision: 'To be the most reliable, efficient, and preferred multi-services partner in Karnataka by delivering value, transparency, and top-tier support.',
          mission: 'To restore client convenience and comfort with professional home appliances repairs, high-performing green energy solutions, and complete hygiene management.',
          coreValues: [
            { title: 'Integrity', desc: 'Honest pricing and 100% genuine spares always.' },
            { title: 'Expertise', desc: 'Fully qualified, background-checked technicians.' },
            { title: 'Promptness', desc: 'Committed to quick response times and resolving issues on the first visit.' },
            { title: 'Eco-conscious', desc: 'Promoting energy-efficient systems and non-toxic services.' }
          ],
          commitment: 'We stand by our work. If you face any issues post-service within 30 days, we perform re-inspection and correction absolutely free of cost!'
        }
      },
      {
        key: 'why_choose_us',
        value: {
          title: 'Why Gadag Trusts Us',
          subtitle: 'We bring precision, quality, and values to every service callback.',
          features: [
            { title: 'Proven Experience', desc: 'Over a decade servicing thousands of happy households and shops.' },
            { title: 'Certified Technicians', desc: 'Specially trained and certified engineers for premium brands.' },
            { title: 'Quick Turnaround', desc: 'Local staff ensures quick reach and same-day diagnosis.' },
            { title: '100% Customer Satisfaction', desc: 'Top ratings, friendly staff, and robust post-service warranties.' }
          ]
        }
      }
    ];

    for (const item of cmsItems) {
      await CmsContent.create(item);
    }
    console.log('Seeded CMS Content sections.');

    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
