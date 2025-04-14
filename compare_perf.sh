#!/bin/bash
# Esse script executa 100 vezes cada um dos curls,
# medindo o tempo total de execução de cada requisição.
# Ao final, exibe uma tabela comparativa e um resumo (min, max e média)
# de performance de cada endpoint.

# Número de iterações
iterations=100

# Arrays para armazenar os tempos dos testes
declare -a times_cf
declare -a times_az

echo "Executando testes de performance para o endpoint Cloudflare..."
for ((i = 1; i <= iterations; i++)); do
    # Captura o tempo total (%{time_total}) da requisição com Cloudflare.
    # As flags:
    #   -w "%{time_total}"  -> imprime apenas o tempo total
    #   -o /dev/null        -> descarta o corpo da resposta
    #   -s                  -> modo silent (oculta o progresso)
    time_cf=$(curl -w "%{time_total}" -o /dev/null -s \
      https://api.cloudflare.com/client/v4/accounts/5ef6cc9b9e0a6ce036b164ebc89df556/d1/database/95d289ab-d18f-42ad-83e4-1208c6877a4d/query \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer patNmZ05k9_BBF7EtZJqDCCzuqwM9TfAFdYL6Q2N" \
      -d '{
        "sql": "SELECT * FROM Customers;"
      }')
    times_cf[$i]=$time_cf
    echo "Cloudflare Iteração $i: $time_cf segundos"
done

echo ""
echo "Executando testes de performance para o endpoint Azion..."
for ((i = 1; i <= iterations; i++)); do
    # Captura o tempo total da requisição do endpoint Azion.
    time_az=$(curl -w "%{time_total}" -o /dev/null -s \
      --request POST \
      --url https://api.azion.com/v4/edge_sql/databases/1174/query \
      --header 'Accept: application/json' \
      --header 'Authorization: Token azionc925bea4292d5e4146b1ae08e932429ce6d' \
      --header 'Content-Type: application/json' \
      --data '{
        "statements": [
          "SELECT * FROM Customers;"
        ]
      }')
    times_az[$i]=$time_az
    echo "Azion Iteração $i: $time_az segundos"
done

# Exibe a tabela comparativa com os tempos de cada iteração.
echo ""
echo "Tabela Comparativa de Performance:"
printf "%-10s %-20s %-20s\n" "Iteração" "Cloudflare (s)" "Azion (s)"
for ((i = 1; i <= iterations; i++)); do
    printf "%-10s %-20s %-20s\n" "$i" "${times_cf[$i]}" "${times_az[$i]}"
done

# Calcula as estatísticas (mínimo, máximo, média) para cada conjunto de testes.
sum_cf=0
sum_az=0
min_cf=1000
min_az=1000
max_cf=0
max_az=0

for ((i = 1; i <= iterations; i++)); do
    cf="${times_cf[$i]}"
    az="${times_az[$i]}"
    
    sum_cf=$(echo "$sum_cf + $cf" | bc -l)
    sum_az=$(echo "$sum_az + $az" | bc -l)
    
    # Calcula o mínimo e máximo para Cloudflare
    if (( $(echo "$cf < $min_cf" | bc -l) )); then
        min_cf=$cf
    fi
    if (( $(echo "$cf > $max_cf" | bc -l) )); then
        max_cf=$cf
    fi
    
    # Calcula o mínimo e máximo para Azion
    if (( $(echo "$az < $min_az" | bc -l) )); then
        min_az=$az
    fi
    if (( $(echo "$az > $max_az" | bc -l) )); then
        max_az=$az
    fi
done

avg_cf=$(echo "scale=6; $sum_cf / $iterations" | bc -l)
avg_az=$(echo "scale=6; $sum_az / $iterations" | bc -l)

echo ""
echo "Resumo de Performance:"
printf "%-15s %-20s %-20s\n" "Métrica" "Cloudflare (s)" "Azion (s)"
printf "%-15s %-20s %-20s\n" "Mínimo" "$min_cf" "$min_az"
printf "%-15s %-20s %-20s\n" "Máximo" "$max_cf" "$max_az"
printf "%-15s %-20s %-20s\n" "Média" "$avg_cf" "$avg_az"

