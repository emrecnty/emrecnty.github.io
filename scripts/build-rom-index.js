const fs = require("fs");
const path = require("path");

const ROM_ROOT = path.join(process.cwd(), "roms");
const OUT_ROOT = path.join(process.cwd(), "data", "roms");
const SYSTEMS = ["gb", "nes", "snes", "genesis", "mame"];

fs.mkdirSync(OUT_ROOT, { recursive: true });

for (const system of SYSTEMS) {
  const folder = path.join(ROM_ROOT, system);

  let files = [];
  if (fs.existsSync(folder)) {
    files = fs.readdirSync(folder).filter(name => !name.startsWith("."));
  }

  fs.writeFileSync(
    path.join(OUT_ROOT, `${system}.json`),
    JSON.stringify(files, null, 2),
    "utf8"
  );

  console.log(system, "tamam");
}
