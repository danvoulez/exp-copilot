# 🎯 minicontratos

**Contratos verificáveis que rodam 100% no seu dispositivo**

minicontratos é um Progressive Web App (PWA) revolucionário que permite criar contratos digitais verificáveis usando linguagem natural em português. Baseado na metalinguagem JSON✯Atomic, oferece assinatura digital criptográfica, prova matemática de autenticidade e execução automática de regras.

## ✨ Características

- 🇧🇷 **Português Natural**: Escreva contratos em português coloquial
- 🔐 **Criptografia**: Assinatura digital Ed25519 e hash BLAKE3
- 💾 **Local-First**: Tudo roda no seu dispositivo (IndexedDB)
- 🤖 **IA Integrada**: Suporte para Anthropic Claude, OpenAI GPT, e Ollama
- 📱 **PWA**: Funciona offline e pode ser instalado como app
- 🔗 **Ledger Imutável**: Cada ação é registrada de forma append-only
- 🌐 **Sem Backend**: Arquitetura 100% client-side

## 🚀 Como Usar

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Primeira Vez

1. Acesse a aplicação
2. Informe seu nome
3. Cole uma chave API de um provedor LLM:
   - **Anthropic** (recomendado): https://console.anthropic.com/settings/keys
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Ollama**: http://localhost:11434 (rodando localmente)
4. Comece a criar contratos!

## 🏗️ Arquitetura

### Stack Técnica

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: TailwindCSS 
- **Storage**: IndexedDB (via idb wrapper)
- **Crypto**: Web Crypto API + @noble/ed25519 + @noble/hashes
- **LLM**: Anthropic Claude / OpenAI GPT / Ollama
- **PWA**: vite-plugin-pwa

### JSON✯Atomic

JSON✯Atomic é uma metalinguagem de orquestração baseada em unidades atômicas chamadas **Spans**. Cada Span representa:

- Uma ação ou evento que aconteceu
- Dados de entrada e resultado
- Regras de validação/execução
- Prova criptográfica de autenticidade

Exemplo de Span:

```json
{
  "id": "01JCXYZ...",
  "trace_id": "contract-abc123",
  "type": "contract.created",
  "entity": "minicontrato",
  "body": {
    "action": "create_contract",
    "input": {
      "parties": {...},
      "amount": 1000,
      "deadline": "2025-12-25T23:59:59Z"
    },
    "rules": [...]
  },
  "started_at": "2025-11-12T10:30:00Z",
  "this": {
    "hash": "blake3:8a3f2b...",
    "version": "1.0.0"
  },
  "confirmed_by": {
    "signature": "ed25519:9c4d...",
    "signer_id": "user-maria-002"
  }
}
```

## 🔐 Segurança

- **API Keys**: Criptografadas com PBKDF2 + AES-GCM
- **Assinaturas**: Ed25519 para autenticidade
- **Hash**: BLAKE3 para integridade
- **Storage**: 100% local no dispositivo do usuário
- **Zero Trust**: Nenhum dado enviado para servidores externos

## 📝 Casos de Uso

- ✅ Contratos de freelance
- ✅ Empréstimos entre pessoas
- ✅ Venda de produtos/serviços
- ✅ Acordos de parceria
- ✅ Contratos de aluguel
- ✅ Qualquer acordo que precise de prova verificável

## 🤝 Contribuindo

Contribuições são bem-vindas! Este é um projeto open-source baseado na especificação JSON✯Atomic.

## 📄 Licença

Este projeto é fornecido como está, para fins educacionais e de demonstração.

## 🎓 Documentação Completa

Para entender a arquitetura completa e a filosofia do sistema, leia o arquivo `PROMPT.md` que contém a especificação detalhada do JSON✯Atomic e do minicontratos.
