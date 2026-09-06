import { writeFile } from "node:fs/promises";
import { galeriaDePrueba, tarjetaSvg } from "../foundry-module/scripts/turno-cartas-modelo.mjs";

const destino = process.argv[2] ?? "/tmp/galeria-cartas-combate.html";
const cartas = galeriaDePrueba().map((carta) => `<figure>${tarjetaSvg(carta)}<figcaption>${carta.nombre}${carta.shiny ? " · shiny" : ""}</figcaption></figure>`).join("\n");
const html = `<!doctype html><meta charset="utf-8"><title>Galería cartas combate</title><style>body{background:#0b0f18;color:#f4e8c8;font:16px sans-serif}main{display:grid;grid-template-columns:repeat(3,120px);gap:20px}figure{margin:0}svg{width:120px;height:160px}figcaption{font-size:12px;text-align:center;margin-top:4px}</style><main>${cartas}</main>`;
await writeFile(destino, html);
console.log(`Galería escrita en ${destino}`);
