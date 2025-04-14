require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Número de iterações
const iterations = 100;

// Endpoints e configurações de requisição

// URL ajustada conforme seu cURL original para o Cloudflare
const cloudflareURL = 'https://api.cloudflare.com/client/v4/accounts/5ef6cc9b9e0a6ce036b164ebc89df556/d1/database/95d289ab-d18f-42ad-83e4-1208c6877a4d/query';
const cfHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.cloudflare_key}`
};
const cfBody = {
  sql: "SELECT * FROM Customers;"
};

const azionURL = 'https://api.azion.com/v4/edge_sql/databases/1174/query';
const azionHeaders = {
  'Accept': 'application/json',
  'Authorization': `Token ${process.env.azion_token}`,
  'Content-Type': 'application/json'
};
const azionBody = {
  statements: [
    "SELECT * FROM Customers;"
  ]
};

// Arrays para armazenar os timings extraídos
let cloudflareTimings = [];
let azionTimings = [];

/**
 * Executa as 100 requisições para o endpoint Cloudflare,
 * extraindo o campo sql_duration_ms do JSON de resposta.
 */
async function runCloudflare() {
  console.log("Executando testes para o endpoint Cloudflare (sql_duration_ms)...");
  for (let i = 0; i < iterations; i++) {
    try {
      const response = await axios.post(cloudflareURL, cfBody, { headers: cfHeaders });
      // Extrai o tempo (sql_duration_ms) do JSON
      const duration = response.data.result[0].meta.timings.sql_duration_ms;
      cloudflareTimings.push(duration);
      console.log(`Cloudflare Iteração ${i + 1}: ${duration} ms`);
    } catch (error) {
      // Se houver resposta de erro, exibe o corpo da resposta para ajudar no debug
      if (error.response) {
        console.error(`Erro na iteração ${i + 1} (Cloudflare):`, error.response.data);
      } else {
        console.error(`Erro na iteração ${i + 1} (Cloudflare):`, error.message);
      }
    }
  }
}

/**
 * Executa as 100 requisições para o endpoint Azion,
 * extraindo o campo query_duration_ms do JSON de resposta.
 */
async function runAzion() {
  console.log("\nExecutando testes para o endpoint Azion (query_duration_ms)...");
  for (let i = 0; i < iterations; i++) {
    try {
      const response = await axios.post(azionURL, azionBody, { headers: azionHeaders });
      // Extrai o tempo (query_duration_ms) do JSON
      const duration = response.data.data[0].results.query_duration_ms;
      azionTimings.push(duration);
      console.log(`Azion Iteração ${i + 1}: ${duration} ms`);
    } catch (error) {
      if (error.response) {
        console.error(`Erro na iteração ${i + 1} (Azion):`, error.response.data);
      } else {
        console.error(`Erro na iteração ${i + 1} (Azion):`, error.message);
      }
    }
  }
}

/**
 * Calcula estatísticas (mínimo, máximo, média) para um array de timings.
 */
function calculateStats(timings) {
  const count = timings.length;
  const sum = timings.reduce((acc, curr) => acc + curr, 0);
  const min = Math.min(...timings);
  const max = Math.max(...timings);
  const avg = sum / count;
  return { min, max, avg };
}

/**
 * Imprime uma tabela comparativa com os timings para cada iteração.
 */
function printTable() {
  console.log("\nTabela Comparativa de Performance (em ms):");
  console.log("Iteração | Cloudflare (ms) | Azion (ms)");
  console.log("---------|-----------------|-----------");
  for (let i = 0; i < iterations; i++) {
    const cfTime = cloudflareTimings[i] !== undefined ? cloudflareTimings[i].toFixed(4) : "N/A";
    const azTime = azionTimings[i] !== undefined ? azionTimings[i].toFixed(4) : "N/A";
    console.log(`${(i + 1).toString().padStart(8)} | ${cfTime.toString().padStart(15)} | ${azTime.toString().padStart(9)}`);
  }
}

async function main() {
  await runCloudflare();
  await runAzion();

  const output = [];
  output.push("Tabela Comparativa de Performance (em ms):");
  output.push("Iteração | Cloudflare (ms) | Azion (ms)");
  output.push("---------|-----------------|-----------");
  for (let i = 0; i < iterations; i++) {
    const cfTime = cloudflareTimings[i] !== undefined ? cloudflareTimings[i].toFixed(4) : "N/A";
    const azTime = azionTimings[i] !== undefined ? azionTimings[i].toFixed(4) : "N/A";
    output.push(`${(i + 1).toString().padStart(8)} | ${cfTime.toString().padStart(15)} | ${azTime.toString().padStart(9)}`);
  }

  printTable();

  if (cloudflareTimings.length > 0 && azionTimings.length > 0) {
    const cfStats = calculateStats(cloudflareTimings);
    const azStats = calculateStats(azionTimings);

    output.push("\nResumo de Performance (em ms):");
    output.push("Métrica    | Cloudflare (ms)    | Azion (ms)");
    output.push("-----------|--------------------|------------");
    output.push(`Mínimo    | ${cfStats.min.toFixed(4).padStart(18)} | ${azStats.min.toFixed(4).padStart(10)}`);
    output.push(`Máximo    | ${cfStats.max.toFixed(4).padStart(18)} | ${azStats.max.toFixed(4).padStart(10)}`);
    output.push(`Média     | ${cfStats.avg.toFixed(4).padStart(18)} | ${azStats.avg.toFixed(4).padStart(10)}`);
  } else {
    output.push("\nNão foi possível calcular as estatísticas, pois houve erros na execução de uma ou ambas as requisições.");
  }

  fs.writeFileSync('output.txt', output.join('\n'));
}

main();

