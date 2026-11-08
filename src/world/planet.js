export const planets = [
  { id: 'cinder', name: 'Cinder', type: 'Каменистый мир', radius: 3_240, orbit: 112, temperature: 438, atmosphere: 'Следы натрия', composition: 'Силикаты, железо', research: 'Низкий', color: '#cf805e', size: 5, revealed: ['type'], scanned: false },
  { id: 'vesper', name: 'Vesper', type: 'Суперземля', radius: 6_810, orbit: 158, temperature: 24, atmosphere: 'Азот · кислород', composition: 'Кремний, вода', research: 'Высокий', color: '#57a9aa', size: 7, revealed: ['type', 'temperature'], scanned: false },
  { id: 'morrow', name: 'Morrow', type: 'Ледяной мир', radius: 4_950, orbit: 207, temperature: -138, atmosphere: 'Метан · азот', composition: 'Водяной лёд', research: 'Средний', color: '#7192c7', size: 6, revealed: ['type'], scanned: false },
  { id: 'khepri', name: 'Khepri', type: 'Газовый гигант', radius: 52_100, orbit: 258, temperature: -194, atmosphere: 'Водород · гелий', composition: 'Водород, гелий', research: 'Высокий', color: '#d8a56e', size: 11, revealed: [], scanned: false },
  { id: 'nadir', name: 'Nadir', type: 'Ледяной карлик', radius: 1_870, orbit: 310, temperature: -226, atmosphere: 'Не обнаружена', composition: 'Азотный лёд', research: 'Низкий', color: '#9a83bc', size: 4, revealed: [], scanned: false },
];

export const starSystem = {
  id: 'helios-9', name: 'Система H-09', designation: 'HELIOSECTOR · 07 / 31', star: { name: 'Helios', type: 'Жёлтый карлик', color: '#f4d595' }, planets,
};
