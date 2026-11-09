export const planets = [
  { id: 'cinder', name: 'Cinder', type: 'Каменистый мир', radius: 3_240, orbit: 112, orbitAU: 0.75, temperature: 438, atmosphere: 'Следы натрия', composition: 'Силикаты, железо', resources: ['железо', 'силикаты'], research: 'Низкий', color: '#cf805e', size: 5, angle: -2.1, revealed: ['type'], scanned: false },
  { id: 'vesper', name: 'Vesper', type: 'Суперземля', radius: 6_810, orbit: 158, orbitAU: 1.06, temperature: 24, atmosphere: 'Азот · кислород', composition: 'Кремний, вода', resources: ['вода', 'кремний'], research: 'Высокий', color: '#57a9aa', size: 7, angle: -0.92, revealed: ['type', 'temperature'], scanned: false },
  { id: 'morrow', name: 'Morrow', type: 'Ледяной мир', radius: 4_950, orbit: 207, orbitAU: 1.38, temperature: -138, atmosphere: 'Метан · азот', composition: 'Водяной лёд', resources: ['водяной лёд', 'метан'], research: 'Средний', color: '#7192c7', size: 6, angle: 0.42, revealed: ['type'], scanned: false },
  { id: 'khepri', name: 'Khepri', type: 'Газовый гигант', radius: 52_100, orbit: 258, orbitAU: 1.72, temperature: -194, atmosphere: 'Водород · гелий', composition: 'Водород, гелий', resources: ['гелий-3', 'водород'], research: 'Высокий', color: '#d8a56e', size: 11, angle: 2.4, revealed: [], scanned: false },
  { id: 'nadir', name: 'Nadir', type: 'Ледяной карлик', radius: 1_870, orbit: 310, orbitAU: 2.07, temperature: -226, atmosphere: 'Не обнаружена', composition: 'Азотный лёд', resources: ['азотный лёд', 'редкоземельные элементы'], research: 'Низкий', color: '#9a83bc', size: 4, angle: 3.45, revealed: [], scanned: false },
];

export const starSystem = {
  id: 'helios-9', seed: 'H-09', name: 'Система H-09', designation: 'HELIOSECTOR · 07 / 31', star: { name: 'Helios', class: 'G', type: 'Жёлтый карлик', luminosity: 1, radius: 1, temperature: 5780, color: '#f4d595', revealed: ['type'] }, planets, discovered: true, visited: true, knowledge: { starSurveyed: false, planetsDetected: true },
};
