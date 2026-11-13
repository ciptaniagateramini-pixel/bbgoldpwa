const path = require('path');
module.exports = {
  content: [path.join(__dirname, 'index.html'), path.join(__dirname, 'src/**/*.{ts,tsx}')],
  theme: {
    extend: {
      colors: {
        biru: '#082A59',
        'biru-2': '#0D3A75',
        mustard: '#E5B527',
        'mustard-muda': '#F6DC7A',
        krem: '#FBF7EC',
        'abu-biru': '#55637E',
      },
      fontFamily: { sans: ['Poppins', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
