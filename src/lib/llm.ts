import type { LLMConfig, Message } from '../types';

const SYSTEM_PROMPT = `Você é o assistente inteligente do minicontratos, um sistema revolucionário de contratos verificáveis.

## SEU PAPEL:

1. **Tradutor de Intenções**: Converta descrições em português para Spans JSON✯Atomic válidos
2. **Validador de Negócio**: Identifique ambiguidades, riscos, e cláusulas faltantes
3. **Educador**: Explique JSON✯Atomic e os conceitos do sistema de forma clara
4. **Vendedor Consultivo**: Ajude o usuário a entender o valor e os casos de uso
5. **Suporte Técnico**: Resolva dúvidas sobre funcionalidades

## JSON✯ATOMIC: A LINGUAGEM DOS CONTRATOS

JSON✯Atomic é uma metalinguagem baseada em **Spans** - unidades atômicas de ação.
Cada Span representa uma intenção ou evento que aconteceu com dados de entrada, resultado e prova criptográfica.

## REGRAS DE OURO:

1. **Sempre valide antes de criar**: Se algo não está claro, PERGUNTE
2. **Seja proativo**: Sugira melhorias mesmo que o usuário não peça
3. **Explique decisões**: Justifique por que você criou cada Span
4. **Use português natural**: Evite termos técnicos sem explicar
5. **Pense em segurança**: Alerte sobre riscos legais ou de execução

Ao criar contratos, retorne JSON válido com os Spans no formato especificado.`;

export async function callLLM(
  userMessage: string,
  config: LLMConfig,
  conversationHistory: Message[] = []
): Promise<string> {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];
  
  switch (config.provider) {
    case 'anthropic':
      return await callAnthropic(messages, config);
    
    case 'openai':
      return await callOpenAI(messages, config);
    
    case 'ollama':
      return await callOllama(messages, config);
    
    default:
      throw new Error(`Provider não suportado: ${config.provider}`);
  }
}

async function callAnthropic(
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: messages.filter(m => m.role !== 'system'),
      system: SYSTEM_PROMPT
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAI(
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOllama(
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  const endpoint = config.apiKey || 'http://localhost:11434';
  
  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model || 'llama2',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      stream: false
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.message.content;
}

export async function testApiKey(apiKey: string, provider: 'anthropic' | 'openai' | 'ollama'): Promise<boolean> {
  try {
    const config: LLMConfig = {
      provider,
      apiKey,
      model: provider === 'anthropic' ? 'claude-sonnet-4-20250514' : provider === 'openai' ? 'gpt-4-turbo-preview' : 'llama2'
    };
    
    await callLLM('Hello', config, []);
    return true;
  } catch (error) {
    console.error('API key test failed:', error);
    return false;
  }
}
