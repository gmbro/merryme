const Replicate = require('replicate');
require('dotenv').config({ path: '.env.local' });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function getModelSpec(modelId) {
  try {
    const parts = modelId.split(':')[0].split('/');
    const version = modelId.split(':')[1];
    const model = await replicate.models.versions.get(parts[0], parts[1], version);
    console.log(`\n=== Parameters for ${parts[0]}/${parts[1]} ===`);
    console.log(JSON.stringify(model.openapi_schema.components.schemas.Input.properties, null, 2));
  } catch(e) {
    console.error(e);
  }
}

async function main() {
  await getModelSpec('codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34');
  await getModelSpec('mertguvencli/face-swap-with-indexes:518f2116425c40acb5c234031c55daf843c1357eff784370fe9489e57b65c150');
}
main();
