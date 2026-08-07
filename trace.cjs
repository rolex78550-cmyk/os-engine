const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

async function trace() {
  const mapPath = './dist/assets/index-975xjn9h.js.map';
  if (!fs.existsSync(mapPath)) {
    console.log('Map file not found');
    return;
  }
  const rawSourceMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  
  await SourceMapConsumer.with(rawSourceMap, null, consumer => {
    const pos = consumer.originalPositionFor({
      line: 3499,
      column: 91613
    });
    console.log(pos);
  });
}

trace();