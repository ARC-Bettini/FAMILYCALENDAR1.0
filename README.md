# FamilyCalendar 1.0

Protótipo funcional de um organizador familiar, com interface em português, tons pastéis e navegação acessível.

## O que pode ser testado

- Visão semanal da família e visão individual por integrante.
- Calendário semanal e mensal; criação, edição e exclusão de compromissos e exportação `.ics`.
- Tarefas com responsáveis, conclusão, filtros, busca e visualização semanal ou em lista.
- Compras compartilhadas com quantidade, categoria, data, busca e marcação de comprado.
- Cadastro e edição de perfis demonstrativos.
- Prévias de e-mail geradas por criação, alteração e exclusão de compromissos; preferências de avisos.
- Texto maior, exportação/importação de dados e restauração dos exemplos.

## Limites desta versão

Os dados são guardados no `localStorage` do navegador. Abas na mesma origem acompanham as alterações, mas dispositivos e contas diferentes **não são sincronizados**. Perfis de exemplo não constituem autenticação. Nenhum e-mail é enviado: os avisos exibem apenas uma prévia e os endereços de exemplo usam `example.com`.

Login real, convites familiares, permissões, banco de dados compartilhado e envio de e-mail são a próxima etapa. Não há credenciais ou dados pessoais reais no código. A publicação inicial do protótipo no Sites é privada para o proprietário.

## Executar localmente

O aplicativo é estático e não exige dependências para executar:

```sh
python3 -m http.server 8080 --directory dist
```

Abra `http://localhost:8080` no navegador. Use um servidor HTTP; módulos JavaScript não devem ser abertos por `file://`.

## Verificações

```sh
npm ci
npm run check
npm test
```

Os testes de modelo verificam datas, filtros por integrante, alterações de registros, destinatários das prévias, validação dos backups e exportação do calendário. Os testes de interface usam um DOM simulado (jsdom) para exercitar os formulários, filtros e persistência; não substituem uma verificação visual em navegador real.

## Estrutura

- `dist/`: aplicação e recursos estáticos prontos para hospedagem.
- `tests/`: testes automatizados de modelo e interação.
- `.openai/hosting.json`: identidade e diretório de publicação no Sites.

Calendário e datas de exemplo são calculados para a semana atual, usando a data de São Paulo. Não existem serviços de terceiros em tempo de execução além da fonte opcional do Google Fonts (com alternativas locais).
