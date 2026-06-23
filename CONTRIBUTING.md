# Contribuindo

Obrigado pelo interesse em contribuir com o **decorar.ai**! 🎉

## Ambiente de desenvolvimento

Pré-requisitos: **Node.js ≥ 20** e **MongoDB** (local ou Docker). Veja o
[README](README.md#-começando) para o passo a passo completo.

```bash
cp .env.example .env        # configure ao menos uma chave do Gemini (ou use BYOK)
npm install                 # workspaces: server + web
npm run seed                # popula os parâmetros de estilo
npm run dev                 # backend (:3333) + frontend (:5173)
```

Leia a [arquitetura](docs/architecture.md) e a [referência da API](docs/api.md)
antes de mexer no backend.

## Fluxo de contribuição

1. Faça um **fork** e crie uma branch a partir da `main`
   (ex.: `feat/nome-curto` ou `fix/nome-curto`).
2. Faça as alterações em commits pequenos e descritivos.
3. Garanta que a aplicação **sobe e funciona** (`npm run dev`) e que o frontend
   **builda** (`npm run build`).
4. Abra um **Pull Request** explicando o quê e o porquê. Inclua prints/vídeos
   quando a mudança for visual.

## Estilo de código

- Siga o estilo já existente no arquivo que você está editando (indentação,
  nomes, densidade de comentários).
- Mantenha os **serviços** (`server/src/services/`) puros e desacoplados do
  Fastify; as **rotas** apenas validam, orquestram e dão forma à resposta.
- **Não exponha segredos** ao cliente. A chave BYOK não deve ser logada nem
  persistida.
- Ao adicionar uma variável de ambiente, atualize **`.env.example`** e
  [`docs/configuration.md`](docs/configuration.md).
- Ao adicionar/alterar endpoints, atualize [`docs/api.md`](docs/api.md).

## Reportando problemas

Abra uma *issue* com passos para reproduzir, comportamento esperado vs. observado
e, se possível, logs ou prints. **Nunca** inclua chaves de API reais.

## Segurança

As rotas `/v1/admin/*` ainda **não têm autenticação** (veja a seção de segurança
no README). Contribuições nessa frente são bem-vindas. Encontrou uma falha
sensível? Relate em privado ao mantenedor antes de abrir uma issue pública.

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob a
[licença MIT](LICENSE) do projeto.
