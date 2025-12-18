import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill, CalendarEvent, User, Condominium } from '../types';
import { BrandConfig } from '../brandConfig';

export const pdfService = {
    /**
     * Gera o PDF de um boleto individual
     */
    generateBillPDF: (bill: Bill, user: User, brandConfig: BrandConfig) => {
        const doc = new jsPDF();
        const primaryColor = brandConfig.primaryHex || '#2563eb';

        // Cabeçalho
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor('#ffffff');
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(brandConfig.name.toUpperCase(), 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('CNPJ: 00.000.000/0001-99', 20, 32);

        doc.setFontSize(16);
        doc.text(`FATURA #${bill.id.replace('b', '')}`, 140, 25);

        // Informações do Pagador
        doc.setTextColor('#334155');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMAÇÕES DO PAGADOR', 20, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nome: ${user.name}`, 20, 62);
        doc.text(`Email: ${user.email}`, 20, 67);
        doc.text(`Unidade: ${user.unitId || 'N/D'} - Bloco: ${user.block || 'N/D'}`, 20, 72);

        // Detalhes da Fatura
        doc.setFont('helvetica', 'bold');
        doc.text('DETALHES DA COBRANÇA', 130, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`Vencimento: ${new Date(bill.dueDate).toLocaleDateString()}`, 130, 62);
        doc.text(`Status: ${bill.status === 'PAID' ? 'PAGO' : 'EM ABERTO'}`, 130, 67);

        // Tabela de Itens
        autoTable(doc, {
            startY: 85,
            head: [['Descrição', 'Valor']],
            body: [
                [bill.description, `R$ ${bill.value.toFixed(2)}`],
                ['Fundo de Reserva (5%)', `R$ ${(bill.value * 0.05).toFixed(2)}`],
                [{ content: 'TOTAL', styles: { fontStyle: 'bold' } }, { content: `R$ ${(bill.value * 1.05).toFixed(2)}`, styles: { fontStyle: 'bold' } }]
            ],
            headStyles: { fillColor: [51, 65, 85] },
            theme: 'striped'
        });

        // Rodapé / Canhoto
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        (doc as any).setLineDash([2, 2], 0);
        doc.line(10, finalY, 200, finalY);

        doc.setFontSize(8);
        doc.setTextColor('#94a3b8');
        doc.text('Corte na linha pontilhada', 105, finalY + 5, { align: 'center' });

        doc.setFillColor('#f8fafc');
        doc.rect(15, finalY + 10, 180, 40, 'F');
        doc.setDrawColor('#cbd5e1');
        (doc as any).setLineDash([], 0);
        doc.rect(15, finalY + 10, 180, 40, 'S');

        doc.setTextColor('#1e293b');
        doc.setFont('helvetica', 'bold');
        doc.text('BANCO GESTOR - BOLETO BANCÁRIO', 20, finalY + 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(bill.barCode, 20, finalY + 28);

        // Fake Barcode Lines
        doc.setFillColor('#000000');
        for (let i = 0; i < 60; i++) {
            const width = Math.random() > 0.5 ? 0.5 : 1.2;
            doc.rect(20 + (i * 2.8), finalY + 32, width, 12, 'F');
        }

        doc.save(`fatura_${bill.id}.pdf`);
    },

    /**
     * Gera o Balancete Mensal
     */
    generateBalancetePDF: (residents: User[], bills: Bill[], condominiumName: string, brandConfig: BrandConfig) => {
        const doc = new jsPDF();
        const primaryColor = brandConfig.primaryHex || '#2563eb';

        // Título
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor('#ffffff');
        doc.setFontSize(18);
        doc.text(`BALANCETE FINANCEIRO - ${condominiumName}`, 20, 20);

        doc.setTextColor('#334155');
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 20, 40);

        // Resumo
        const totalValue = bills.reduce((acc, b) => acc + b.value, 0);
        const paidValue = bills.filter(b => b.status === 'PAID').reduce((acc, b) => acc + b.value, 0);
        const pendingValue = totalValue - paidValue;

        doc.setFont('helvetica', 'bold');
        doc.text('RESUMO DO PERÍODO', 20, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(`Receita Prevista: R$ ${totalValue.toFixed(2)}`, 20, 57);
        doc.text(`Receita Realizada: R$ ${paidValue.toFixed(2)}`, 20, 62);
        doc.text(`Inadimplência: R$ ${pendingValue.toFixed(2)}`, 20, 67);

        // Tabela de Moradores
        autoTable(doc, {
            startY: 75,
            head: [['Morador', 'Unidade', 'Bloco', 'Status Financeiro']],
            body: residents.map(r => [
                r.name,
                r.unitId || 'N/D',
                r.block || '—',
                r.financialStatus === 'PAID' ? 'Em dia' : 'Inadimplente'
            ]),
            headStyles: { fillColor: [51, 65, 85] }
        });

        doc.save(`balancete_${condominiumName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    },

    /**
     * Gera o Comprovante de Reserva
     */
    generateReservationPDF: (event: CalendarEvent, rules: string[], brandConfig: BrandConfig) => {
        const doc = new jsPDF();
        const primaryColor = brandConfig.primaryHex || '#2563eb';

        // Cabeçalho
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor('#ffffff');
        doc.setFontSize(20);
        doc.text('COMPROVANTE DE RESERVA', 105, 22, { align: 'center' });

        // Conteúdo
        doc.setTextColor('#334155');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALHES DO AGENDAMENTO', 20, 50);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Título: ${event.title}`, 20, 60);
        doc.text(`Recurso: ${event.resource}`, 20, 65);
        doc.text(`Data: ${new Date(event.date).toLocaleDateString()}`, 20, 70);
        doc.text(`Horário: ${event.startTime} às ${event.endTime}`, 20, 75);
        doc.text(`Morador: ${event.userName}`, 20, 80);

        // Regras
        if (rules && rules.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('REGRAS DE USO E CONVIVÊNCIA', 20, 95);
            doc.setFont('helvetica', 'normal');
            rules.forEach((rule, index) => {
                doc.text(`• ${rule}`, 25, 102 + (index * 6));
            });
        }

        // Assinatura Digital / QR Code Mock
        const bottomY = 240;
        doc.setDrawColor('#e2e8f0');
        doc.line(20, bottomY, 190, bottomY);
        doc.setFontSize(8);
        doc.text('Este documento é um comprovante digital gerado pelo sistema GestorCondo.', 105, bottomY + 10, { align: 'center' });
        doc.text(`ID da Reserva: ${event.id}`, 105, bottomY + 15, { align: 'center' });

        doc.save(`comprovante_reserva_${event.id}.pdf`);
    }
};
