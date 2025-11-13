import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getAllContracts } from '../lib/db';
import type { Contract } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    try {
      const allContracts = await getAllContracts();
      setContracts(allContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              m
            </div>
            <h1 className="text-xl font-bold">minicontratos</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              ⚙️ Configurações
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Card */}
        <Card className="mb-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-2">
              ✨ Criar Novo Contrato
            </h2>
            <p className="text-blue-100 mb-6">
              Descreva em português o que você precisa. O sistema cria o contrato verificável para você.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => navigate('/create')}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <span className="mr-2">+</span>
              Novo Contrato
            </Button>
          </CardContent>
        </Card>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Contratos</p>
                  <p className="text-2xl font-bold">{contracts.length}</p>
                </div>
                <div className="text-4xl">📄</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {contracts.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {contracts.filter(c => c.status === 'completed').length}
                  </p>
                </div>
                <div className="text-4xl">🎉</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rascunhos</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {contracts.filter(c => c.status === 'draft').length}
                  </p>
                </div>
                <div className="text-4xl">📝</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contracts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Seus Contratos</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando contratos...</p>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum contrato ainda
                </h3>
                <p className="text-gray-600 mb-6">
                  Crie seu primeiro contrato verificável!
                </p>
                <Button onClick={() => navigate('/create')}>
                  <span className="mr-2">+</span>
                  Criar Primeiro Contrato
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {contracts.map(contract => (
                <Card key={contract.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{contract.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            contract.status === 'active' ? 'bg-green-100 text-green-800' :
                            contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            contract.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {contract.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>👥 {contract.parties.length} partes</span>
                          <span>📅 {new Date(contract.created_at).toLocaleDateString('pt-BR')}</span>
                          <span>🔗 {contract.spans.length} spans</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {contract.parties.map((party, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                              <span>{party.name}</span>
                              <span className="text-gray-400">({party.role})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => navigate(`/contract/${contract.id}`)}
                        >
                          👁️ Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
