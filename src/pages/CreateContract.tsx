import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { callLLM } from '../lib/llm';
import { getCredential, getCurrentUser, appendToLedger, saveContract } from '../lib/db';
import { decryptApiKey, generateId, calculateSpanHash } from '../lib/crypto';
import type { Message, Span, Contract } from '../types';

const TEMPLATES = {
  freelance: `Contrato de prestação de serviços:
- Freelancer entrega logo completo
- Cliente paga R$ 2.000 após aprovação
- Prazo de 30 dias para entrega
- 2 rodadas de revisão incluídas
- Multa de 2% + juros de 1% ao mês em caso de atraso no pagamento`,

  loan: `Empréstimo entre amigos:
- João empresta R$ 5.000 para Maria
- Maria paga em 12 parcelas de R$ 450
- Vencimento: dia 5 de cada mês
- Juros de 2% ao mês sobre o saldo devedor
- Multa de 10% em caso de atraso`,

  sale: `Venda de produto:
- Vendedor: João
- Comprador: Maria
- Produto: Macbook Pro 2024
- Valor: R$ 12.000
- Pagamento: 50% entrada + 50% na entrega
- Garantia: 30 dias`,
};

export const CreateContract: React.FC = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setGenerating(true);
    setError('');
    
    try {
      // Get current user and credentials
      const user = await getCurrentUser();
      if (!user) {
        setError('Usuário não encontrado. Faça login novamente.');
        navigate('/');
        return;
      }
      
      const credential = await getCredential(user.id);
      if (!credential) {
        setError('Credenciais não encontradas. Faça login novamente.');
        navigate('/');
        return;
      }
      
      // Decrypt API key
      const apiKey = await decryptApiKey(credential.encrypted_key, user.id);
      
      // Add user message to conversation
      const userMessage: Message = {
        role: 'user',
        content: description
      };
      const newConversation = [...conversation, userMessage];
      setConversation(newConversation);
      
      // Call LLM
      const response = await callLLM(
        description,
        {
          provider: credential.provider,
          apiKey,
          model: credential.provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 
                 credential.provider === 'openai' ? 'gpt-4-turbo-preview' : 'llama2'
        },
        conversation
      );
      
      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response
      };
      setConversation([...newConversation, assistantMessage]);
      
      setDescription('');
      
    } catch (err) {
      console.error('Error generating contract:', err);
      setError('Erro ao processar. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveContract = async () => {
    try {
      // Create a simple contract for demo
      const traceId = generateId();
      
      const span: Partial<Span> = {
        id: generateId(),
        trace_id: traceId,
        type: 'contract.created',
        entity: 'minicontrato',
        body: {
          action: 'create_contract',
          input: {
            description: conversation[0]?.content || 'Novo contrato',
          },
          output: {
            success: true,
          }
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        this: {
          hash: '',
          version: '1.0.0'
        }
      };
      
      span.this!.hash = await calculateSpanHash(span);
      
      await appendToLedger(span as Span);
      
      const contract: Contract = {
        id: traceId,
        title: 'Novo Contrato',
        parties: [],
        status: 'draft',
        created_at: new Date().toISOString(),
        spans: [span.id!],
        last_updated: new Date().toISOString()
      };
      
      await saveContract(contract);
      
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Error saving contract:', err);
      setError('Erro ao salvar contrato.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            ← Voltar
          </Button>
          <h1 className="text-xl font-bold">Criar Contrato</h1>
          <div className="w-20" />
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>📝 Descreva seu contrato</CardTitle>
            <CardDescription>
              Escreva em português natural. Nosso assistente vai te ajudar a criar um contrato completo e verificável.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Templates rápidos */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDescription(TEMPLATES.freelance)}
              >
                💼 Freelance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDescription(TEMPLATES.loan)}
              >
                💰 Empréstimo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDescription(TEMPLATES.sale)}
              >
                🛒 Venda
              </Button>
            </div>
            
            {/* Área de conversação */}
            <div className="border rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-4 bg-gray-50">
              {conversation.length === 0 ? (
                <p className="text-gray-400 text-center">
                  Comece descrevendo o contrato que você precisa...
                </p>
              ) : (
                conversation.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-900 border'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              {generating && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-lg p-3">
                    <div className="animate-pulse">Gerando resposta...</div>
                  </div>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Ex: João deve pagar R$ 1.000 para Maria até 25/12/2025..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={3}
                className="flex-1"
              />
              <Button 
                onClick={handleSubmit}
                disabled={!description.trim() || generating}
                size="lg"
              >
                {generating ? '⏳' : '📤'}
              </Button>
            </div>
            
            {conversation.length > 0 && (
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setConversation([])}
                  className="flex-1"
                >
                  Refazer
                </Button>
                <Button 
                  onClick={handleSaveContract}
                  className="flex-1"
                >
                  ✓ Salvar Contrato
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
