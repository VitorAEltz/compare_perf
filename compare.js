require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const runCloudflareOnly = args.includes('--cf');
const runAzionOnly = args.includes('--azion');
const runTursoOnly = args.includes('--turso');
const runAll = !runCloudflareOnly && !runAzionOnly && !runTursoOnly;

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

const tursoURL = 'https://my-db-vitoraeltz.aws-us-east-1.turso.io/v2/pipeline';
const tursoHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.turso_token}`
};
const tursoBody = {
  requests: [
    { type: "execute", stmt: { sql: "SELECT * FROM users" } },
    { type: "close" }
  ]
};

// Arrays para armazenar os timings extraídos
let cloudflareTimings = [];
let azionTimings = [];
let tursoTimings = [];

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
 * Executa as 100 requisições para o endpoint Turso,
 * extraindo o campo query_duration_ms do JSON de resposta.
 */
async function runTurso() {
  console.log("\nExecutando testes para o endpoint Turso (query_duration_ms)...");
  for (let i = 0; i < iterations; i++) {
    try {
      const response = await axios.post(tursoURL, tursoBody, { headers: tursoHeaders });
      // Extrai o tempo (query_duration_ms) do JSON
      const duration = response.data.results[0].response.result.query_duration_ms;
      tursoTimings.push(duration);
      console.log(`Turso Iteração ${i + 1}: ${duration} ms`);
    } catch (error) {
      if (error.response) {
        console.error(`Erro na iteração ${i + 1} (Turso):`, error.response.data);
      } else {
        console.error(`Erro na iteração ${i + 1} (Turso):`, error.message);
      }
    }
  }
}

/**
 * Calcula o valor do percentil P para um array de timings.
 * @param {Array} timings - Array de tempos de resposta
 * @param {Number} p - Percentil desejado (0-100)
 * @returns {Number} - Valor do percentil P
 */
function calculatePercentile(timings, p) {
  // Ordenar o array de forma crescente
  const sorted = [...timings].sort((a, b) => a - b);
  
  // Calcular a posição do percentil
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  
  // Retornar o valor na posição calculada
  return sorted[index];
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
  const p95 = calculatePercentile(timings, 95);
  const p99 = calculatePercentile(timings, 99);
  return { min, max, avg, p95, p99 };
}

async function main() {
  // Run tests based on command line arguments
  if (runAll || runCloudflareOnly) {
    await runCloudflare();
  }
  
  if (runAll || runAzionOnly) {
    await runAzion();
  }
  
  if (runAll || runTursoOnly) {
    await runTurso();
  }

  const output = [];
  output.push("Tabela Comparativa de Performance (em ms):");
  
  // Adjust table headers based on which providers were tested
  let tableHeader = "Iteração";
  let tableDivider = "---------";
  
  if (runAll || runCloudflareOnly) {
    tableHeader += " | Cloudflare (ms)";
    tableDivider += "|------------------";
  }
  
  if (runAll || runAzionOnly) {
    tableHeader += " | Azion (ms)";
    tableDivider += "|------------";
  }
  
  if (runAll || runTursoOnly) {
    tableHeader += " | Turso (ms)";
    tableDivider += "|------------";
  }
  
  output.push(tableHeader);
  output.push(tableDivider);
  
  // Generate table rows
  for (let i = 0; i < iterations; i++) {
    let row = `${(i + 1).toString().padStart(8)}`;
    
    if (runAll || runCloudflareOnly) {
      const cfTime = cloudflareTimings[i] !== undefined ? cloudflareTimings[i].toFixed(4) : "N/A";
      row += ` | ${cfTime.toString().padStart(15)}`;
    }
    
    if (runAll || runAzionOnly) {
      const azTime = azionTimings[i] !== undefined ? azionTimings[i].toFixed(4) : "N/A";
      row += ` | ${azTime.toString().padStart(9)}`;
    }
    
    if (runAll || runTursoOnly) {
      const tuTime = tursoTimings[i] !== undefined ? tursoTimings[i].toFixed(4) : "N/A";
      row += ` | ${tuTime.toString().padStart(9)}`;
    }
    
    output.push(row);
  }

  // Print table to console
  console.log("\n" + output.slice(0, 3).join("\n"));
  for (let i = 3; i < output.length; i++) {
    console.log(output[i]);
  }

  // Calculate and display statistics
  const providersWithData = [];
  const statsData = {};
  
  if ((runAll || runCloudflareOnly) && cloudflareTimings.length > 0) {
    providersWithData.push("Cloudflare");
    statsData.cloudflare = calculateStats(cloudflareTimings);
  }
  
  if ((runAll || runAzionOnly) && azionTimings.length > 0) {
    providersWithData.push("Azion");
    statsData.azion = calculateStats(azionTimings);
  }
  
  if ((runAll || runTursoOnly) && tursoTimings.length > 0) {
    providersWithData.push("Turso");
    statsData.turso = calculateStats(tursoTimings);
  }

  if (providersWithData.length > 0) {
    output.push("\nResumo de Performance (em ms):");
    
    // Generate stats table header
    let statsHeader = "Métrica   ";
    let statsDivider = "----------";
    
    providersWithData.forEach(provider => {
      if (provider === "Cloudflare") {
        statsHeader += " | Cloudflare (ms)   ";
        statsDivider += "|--------------------";
      } else if (provider === "Azion") {
        statsHeader += " | Azion (ms)        ";
        statsDivider += "|--------------------";
      } else if (provider === "Turso") {
        statsHeader += " | Turso (ms)        ";
        statsDivider += "|--------------------";
      }
    });
    
    output.push(statsHeader);
    output.push(statsDivider);
    
    // Generate stats rows
    const metrics = ["min", "max", "avg", "p95", "p99"];
    const metricLabels = {
      "min": "Mínimo   ",
      "max": "Máximo   ",
      "avg": "Média    ",
      "p95": "P95      ",
      "p99": "P99      "
    };
    
    metrics.forEach(metric => {
      let row = metricLabels[metric];
      
      providersWithData.forEach(provider => {
        const value = statsData[provider.toLowerCase()][metric].toFixed(4);
        row += ` | ${value.padStart(18)}`;
      });
      
      output.push(row);
      console.log(row);
    });
  } else {
    const errorMsg = "\nNão foi possível calcular as estatísticas, pois houve erros na execução das requisições.";
    output.push(errorMsg);
    console.log(errorMsg);
  }

  fs.writeFileSync('output.txt', output.join('\n'));
}

main();

