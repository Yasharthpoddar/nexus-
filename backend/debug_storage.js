require('dotenv').config();
const storageService = require('./services/storageService');
async function test() {
  try {
    const txt = "Hello World";
    const remote = await storageService.uploadToStorage('nexus-certificates', 'hello.pdf', Buffer.from(txt), 'application/pdf');
    console.log("Upload Success:", remote);
    
    const url = await storageService.getSignedUrl('nexus-certificates', 'hello.pdf', 3600);
    console.log("Fetch Success:", url);
  } catch(e) {
    console.error("Test Error:", e.message);
  }
}
test();
