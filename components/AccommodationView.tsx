
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, 
  Bed, 
  Plus, 
  Trash2, 
  Printer, 
  ChevronLeft, 
  ChevronUp,
  ChevronDown,
  Hotel, 
  UserPlus, 
  Users2,
  Save,
  MapPin,
  Calculator,
  UserCircle,
  Briefcase,
  ShieldCheck,
  Search,
  CheckCircle2
} from 'lucide-react';
import { MasterTrip, Room, Program, Transaction, Customer, Supplier, Currency, CostCenter, Employee } from '../types';
import SearchableSelect from './SearchableSelect';

interface AccommodationViewProps {
  trip: MasterTrip;
  masterTrips: MasterTrip[];
  programs: Program[];
  customers: Customer[];
  suppliers: Supplier[];
  currencies: Currency[];
  employees: Employee[];
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  addTransaction: (tx: any) => void;
  voidTransaction: (id: string, silent?: boolean) => void;
  transactions: Transaction[];
  onSave: (tripId: string, accommodation: MasterTrip['accommodation']) => void;
  onBack: () => void;
  onTripChange?: (tripId: string) => void;
  settings: { name: string; logo: string; phone?: string; address?: string; baseCurrency?: string };
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
  currentUser: any;
}

const AccommodationView: React.FC<AccommodationViewProps> = ({ 
  trip: initialTrip, 
  masterTrips, 
  programs, 
  customers,
  suppliers,
  currencies,
  employees,
  costCenters,
  enableCostCenters,
  addTransaction,
  voidTransaction,
  transactions,
  onSave, 
  onBack, 
  onTripChange,
  settings,
  initialEditingId,
  onClearInitialEdit,
  currentUser
}) => {
  const [internalSelectedTripId, setInternalSelectedTripId] = useState('');
  const selectedTripId = internalSelectedTripId || initialTrip?.id || '';

  const setSelectedTripId = (id: string) => {
    setInternalSelectedTripId(id);
    if (onTripChange) onTripChange(id);
  };

  const [activeCity, setActiveCity] = useState<'mecca' | 'medina'>('mecca');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  
  const currentTrip = useMemo(() => 
    (masterTrips || []).find(t => t?.id === selectedTripId) || initialTrip, 
    [selectedTripId, masterTrips, initialTrip]
  );

  const [accommodation, setAccommodation] = useState<MasterTrip['accommodation']>(
    currentTrip?.accommodation || {
      mecca: { hotelName: '', rooms: [] },
      medina: { hotelName: '', rooms: [] }
    }
  );

  const [isDirty, setIsDirty] = useState(false);
  const lastTripIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialEditingId && accommodation) {
      const tx = (transactions || []).find(t => t?.id === initialEditingId);
      if (tx && tx.roomId) {
        // Find which city the room belongs to
        const inMecca = (accommodation.mecca?.rooms || []).some(r => r?.id === tx.roomId);
        const inMedina = (accommodation.medina?.rooms || []).some(r => r?.id === tx.roomId);
        
        if (inMecca) setActiveCity('mecca');
        else if (inMedina) setActiveCity('medina');
        
        setHighlightedRoomId(tx.roomId);
        
        // Scroll to the room after a short delay
        setTimeout(() => {
          const element = document.getElementById(`room-card-${tx.roomId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove highlight after some time
            setTimeout(() => setHighlightedRoomId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, transactions, accommodation, onClearInitialEdit]);

  // Update accommodation when trip changes or when not dirty during sync
  useEffect(() => {
    const currentId = currentTrip?.id || null;
    const tripChanged = currentId !== lastTripIdRef.current;

    if (tripChanged || !isDirty) {
      if (currentTrip && currentTrip.accommodation) {
        setAccommodation(currentTrip.accommodation);
      } else {
        setAccommodation({
          mecca: { hotelName: '', rooms: [] },
          medina: { hotelName: '', rooms: [] }
        });
      }
      
      if (tripChanged) {
        lastTripIdRef.current = currentId;
        setIsDirty(false);
      }
    }
  }, [currentTrip, isDirty]);

  const currentData = (accommodation || {})[activeCity] || { hotelName: '', rooms: [] };
  const tripPrograms = (programs || []).filter(p => p?.masterTripId === selectedTripId);

  const updateHotelName = (name: string) => {
    setIsDirty(true);
    setAccommodation(prev => {
      setIsDirty(true);
      if (!prev) return {
        mecca: { hotelName: '', rooms: [] },
        medina: { hotelName: '', rooms: [] }
      };
      return {
        ...prev,
        [activeCity]: { ...(prev[activeCity] || { hotelName: '', rooms: [] }), hotelName: name }
      };
    });
  };

  const addRoom = () => {
    setIsDirty(true);
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      roomNumber: '',
      roomType: 'ثنائي',
      names: [''],
      customerType: 'DIRECT',
      pricingMode: 'PER_PERSON',
      sellingPrice: 0,
      purchasePrice: 0,
      discount: 0,
      totalAmount: 0,
      employeeId: '',
      employeeCommissionRate: 0,
      commissionAmount: 0,
      costCenterId: ''
    };
    setAccommodation(prev => {
      setIsDirty(true);
      const currentPrev = prev || {
        mecca: { hotelName: '', rooms: [] },
        medina: { hotelName: '', rooms: [] }
      };
      const cityData = currentPrev[activeCity] || { hotelName: '', rooms: [] };
      return {
        ...currentPrev,
        [activeCity]: { 
          ...cityData, 
          rooms: [...(cityData.rooms || []), newRoom] 
        }
      };
    });
  };

  const calculateTotal = (room: Room) => {
    if (!room) return 0;
    const count = (room.names || []).length;
    const price = room.sellingPrice || 0;
    const roomDiscount = room.discount || 0;
    
    let total = 0;
    if (room.pricingMode === 'PER_PERSON') {
      total = (count * price);
    } else if (room.pricingMode === 'INDIVIDUAL') {
      total = (room.names || []).reduce((acc, _, idx) => acc + (room.occupantEntities?.[idx]?.sellingPrice || 0), 0);
    } else {
      total = price; // Total mode
    }

    // Subtract room level discount
    total -= roomDiscount;

    // Subtract individual discounts
    if (room.occupantEntities) {
      Object.values(room.occupantEntities || {}).forEach(ent => {
        if (ent) total -= ((ent as any).discount || 0);
      });
    }

    return total;
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    setIsDirty(true);
    setAccommodation(prev => {
      setIsDirty(true);
      if (!prev) return prev;
      const cityData = prev[activeCity] || { hotelName: '', rooms: [] };
      const updatedRooms = (cityData.rooms || []).map(r => {
        if (r && r.id === roomId) {
          const newRoom = { ...r, ...updates };
          newRoom.totalAmount = calculateTotal(newRoom);
          return newRoom;
        }
        return r;
      });
      return {
        ...prev,
        [activeCity]: { ...cityData, rooms: updatedRooms }
      };
    });
  };

  const copyToOtherCity = () => {
    const sourceCity = activeCity;
    const targetCity = activeCity === 'mecca' ? 'medina' : 'mecca';
    
    const targetRooms = (accommodation || {})[targetCity]?.rooms || [];
    if (targetRooms.length > 0) {
      if (!confirm(`يوجد بيانات تسكين بالفعل في ${targetCity === 'mecca' ? 'مكة' : 'المدينة'}. هل تريد استبدالها ببيانات ${sourceCity === 'mecca' ? 'مكة' : 'المدينة'}؟`)) {
        return;
      }
    }

    const sourceRooms = ((accommodation || {})[sourceCity]?.rooms || []).map(r => {
      if (!r) return r;
      const newOccupantEntities = { ...(r.occupantEntities || {}) };
      Object.keys(newOccupantEntities).forEach(key => {
        const idx = parseInt(key);
        if (newOccupantEntities[idx]) {
          newOccupantEntities[idx] = { 
            ...newOccupantEntities[idx], 
            sellingPrice: 0,
            purchasePrice: 0 
          };
        }
      });

      return {
        ...r,
        id: `room-${Date.now()}-${Math.random()}`, // New IDs for the other city
        sellingPrice: 0, // Reset selling price as it's entered once
        purchasePrice: 0, // Reset purchase price as well
        totalAmount: 0,
        postedAmount: 0,
        isPosted: false,
        occupantEntities: newOccupantEntities
      };
    });

    setAccommodation(prev => {
      setIsDirty(true);
      setIsDirty(true);
      if (!prev) return prev;
      return {
        ...prev,
        [targetCity]: {
          ...(prev[targetCity] || { hotelName: '', rooms: [] }),
          rooms: sourceRooms
        }
      };
    });
    
    alert(`تم نسخ التوزيع إلى ${targetCity === 'mecca' ? 'مكة المكرمة' : 'المدينة المنورة'} بنجاح. تذكر أن سعر البيع تم تصفيره لمنع التكرار.`);
    setActiveCity(targetCity);
  };

  const addNameRow = (roomId: string) => {
    const room = (currentData?.rooms || []).find(r => r && r.id === roomId);
    if (room) {
      const newNames = [...(room.names || []), ''];
      updateRoom(roomId, { names: newNames });
    }
  };

  const removeName = (roomId: string, index: number) => {
    const room = (currentData?.rooms || []).find(r => r && r.id === roomId);
    if (room) {
      const newNames = (room.names || []).filter((_, i) => i !== index);
      updateRoom(roomId, { names: newNames.length ? newNames : [''] });
    }
  };

  const removeRoom = (roomId: string) => {
    const rooms = currentData?.rooms || [];
    const room = rooms.find(r => r && r.id === roomId);
    if (room && room.isPosted) {
      if (!confirm('هذه الغرفة مرحلة مالياً. هل تريد حذفها وإلغاء كافة فواتيرها المرتبطة؟')) {
        return;
      }
      // Void transactions
      const oldTxs = (transactions || []).filter(t => 
        t && !t.isVoided && 
        t.masterTripId === selectedTripId && 
        (t.roomId === room.id || ((t.description || '').includes(`غرفة: ${room.roomNumber} - `) && (t.description || '').includes(activeCity === 'mecca' ? 'مكة' : 'المدينة')))
      );
      oldTxs.forEach(t => t?.id && voidTransaction(t.id, true));
    }

    setAccommodation(prev => {
      setIsDirty(true);
      if (!prev) return prev;
      const cityData = prev[activeCity] || { hotelName: '', rooms: [] };
      return {
        ...prev,
        [activeCity]: {
          ...cityData,
          rooms: (cityData.rooms || []).filter(r => r && r.id !== roomId)
        }
      };
    });
  };

  const moveRoom = (roomId: string, direction: 'up' | 'down') => {
    const rooms = currentData?.rooms || [];
    const index = rooms.findIndex(r => r?.id === roomId);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= rooms.length) return;

    setAccommodation(prev => {
      setIsDirty(true);
      if (!prev) return prev;
      const cityData = prev[activeCity] || { hotelName: '', rooms: [] };
      const updatedRooms = [...(cityData.rooms || [])];
      const [movedRoom] = updatedRooms.splice(index, 1);
      updatedRooms.splice(newIndex, 0, movedRoom);
      return {
        ...prev,
        [activeCity]: { ...cityData, rooms: updatedRooms }
      };
    });
  };

  const toggleSelectAll = () => {
    const rooms = currentData?.rooms || [];
    if (selectedIds.length === rooms.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rooms.map(r => r?.id).filter(Boolean) as string[]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    const rooms = currentData?.rooms || [];
    const postedCount = (rooms || []).filter(r => r && selectedIds.includes(r.id) && r.isPosted).length;
    let msg = `هل أنت متأكد من حذف ${selectedIds.length} من الغرف المختارة؟`;
    if (postedCount > 0) {
      msg = `تنبيه: يوجد ${postedCount} غرف مرحلة مالياً. حذفها سيؤدي لإلغاء فواتيرها بالكامل. هل أنت متأكد؟`;
    }

    if (confirm(msg)) {
      selectedIds.forEach(id => {
        const room = (rooms || []).find(r => r && r.id === id);
        if (room?.isPosted) {
          const oldTxs = (transactions || []).filter(t => 
            t && !t.isVoided && 
            t.masterTripId === selectedTripId && 
            (t.roomId === room.id || ((t.description || '').includes(`غرفة: ${room.roomNumber} - `) && (t.description || '').includes(activeCity === 'mecca' ? 'مكة' : 'المدينة')))
          );
          oldTxs.forEach(t => t?.id && voidTransaction(t.id, true));
        }
      });

      setAccommodation(prev => {
      setIsDirty(true);
        if (!prev) return prev;
        const cityData = prev[activeCity] || { hotelName: '', rooms: [] };
        return {
          ...prev,
          [activeCity]: {
            ...cityData,
            rooms: (cityData.rooms || []).filter(r => r && !selectedIds.includes(r.id))
          }
        };
      });
      setSelectedIds([]);
    }
  };

  const processRoomPosting = (room: Room, city: 'mecca' | 'medina', hotelName: string) => {
    if (!room) return false;
    const oldTxs = (transactions || []).filter(t => 
      t && !t.isVoided && 
      t.masterTripId === selectedTripId && 
      (t.roomId === room.id || ((t.description || '').includes(`غرفة: ${room.roomNumber} - `) && (t.description || '').includes(city === 'mecca' ? 'مكة' : 'المدينة')))
    );
    
    oldTxs.forEach(t => t?.id && voidTransaction(t.id, true));

    if (!room.programId) return false;

    const program = (programs || []).find(p => p && p.id === room.programId);
    if (!program) return false;

    // Find the hotel component for this city to link correctly
    const hotelComponent = (program.components || []).find(c => 
      c && c.type === 'HOTEL' && (
        (city === 'mecca' && ((c.name || '').includes('مكة') || (c.name || '').toLowerCase().includes('mecca') || (c.name || '').includes('مكه'))) ||
        (city === 'medina' && ((c.name || '').includes('مدينة') || (c.name || '').toLowerCase().includes('medina') || (c.name || '').includes('مدينه')))
      )
    ) || (program.components || []).find(c => c && c.type === 'HOTEL');

    const currency = (currencies || []).find(c => c && c.code === program.currencyCode);
    const rate = room.exchangeRate || currency?.rateToMain || 1;

    const validNames = (room.names || []).filter(n => n && n.trim());
    const occupantsCount = validNames.length;
    if (occupantsCount === 0) return false;

    const unitSellingRoom = room.pricingMode === 'PER_PERSON' ? (room.sellingPrice || 0) : (room.sellingPrice || 0) * (1 / occupantsCount);
    const unitPurchaseRoom = room.pricingMode === 'PER_PERSON' ? (room.purchasePrice || 0) : (room.purchasePrice || 0) * (1 / occupantsCount);
    const unitDiscount = (room.discount || 0) / occupantsCount;
    const unitCommissionAmount = (room.commissionAmount || 0) / occupantsCount;

    validNames.forEach((name, idx) => {
      const originalIdx = (room.names || []).indexOf(name);
      if (originalIdx === -1) return;
      const occupantData = room.occupantEntities?.[originalIdx];
      if (occupantData?.customerType === 'SUPERVISOR') return;

      let entityId = occupantData?.agentId || room.agentId || '';
      let cType = occupantData?.customerType || room.customerType || 'DIRECT';

      const individualDiscount = occupantData?.discount || 0;
      const finalSelling = (room.pricingMode === 'INDIVIDUAL' ? (occupantData?.sellingPrice || 0) : unitSellingRoom);
      const finalPurchase = room.pricingMode === 'INDIVIDUAL' ? (occupantData?.purchasePrice || 0) : unitPurchaseRoom;
      
      const typeStr = occupantData?.personType === 'CHILD' ? ' - طفل' : occupantData?.personType === 'INFANT' ? ' - رضيع' : ' - بالغ';

      const totalDiscountForPerson = unitDiscount + individualDiscount;

      if (finalSelling > 0 || finalPurchase > 0) {
        addTransaction({
          description: `تسكين فردي${typeStr} - ${city === 'mecca' ? 'مكة' : 'المدينة'} - فندق: ${hotelName} - غرفة: ${room.roomNumber} - معتمر: ${name}`,
          amount: finalSelling - totalDiscountForPerson,
          currencyCode: program.currencyCode,
          exchangeRate: rate,
          type: 'INCOME',
          category: 'HAJJ_UMRAH',
          date: room.postingDate || new Date().toISOString().split('T')[0],
          relatedEntityId: entityId || undefined,
          relatedEntityType: cType === 'SUPPLIER' ? 'SUPPLIER' : 'CUSTOMER',
          supplierId: program.supplierId,
          supplierType: (program as any).supplierType || 'SUPPLIER',
          purchasePrice: finalPurchase,
          sellingPrice: finalSelling,
          discount: totalDiscountForPerson,
          programId: room.programId,
          masterTripId: selectedTripId,
          isSaleOnly: false,
          accommodation: hotelName,
          roomType: room.roomType === 'فردي' ? 'SINGLE' : room.roomType === 'ثنائي' ? 'DOUBLE' : room.roomType === 'ثلاثي' ? 'TRIPLE' : room.roomType === 'رباعي' ? 'QUAD' : 'DEFAULT',
          employeeId: room.employeeId,
          employeeCommissionRate: room.employeeCommissionRate,
          commissionAmount: unitCommissionAmount,
          applyCommission: true,
          costCenterId: room.costCenterId,
          roomId: room.id,
          occupantIndex: originalIdx,
          componentId: hotelComponent?.id
        });
      }
    });
    return true;
  };

  const postRoomFinancials = (room: Room) => {
    if (!room.programId) {
      alert('الرجاء اختيار البرنامج أولاً');
      return;
    }
    if ((room.names || []).filter(n => n && n.trim()).length === 0) {
      alert('الرجاء إدخال أسماء المعتمرين قبل الترحيل');
      return;
    }

    const isUpdate = room.isPosted && room.totalAmount !== room.postedAmount;
    const confirmMsg = isUpdate 
      ? `تم اكتشاف تغيير في السعر (من ${room.postedAmount} إلى ${room.totalAmount}). سيتم إلغاء الترحيل القديم وإعادة الترحيل بالسعر الجديد. هل أنت متأكد؟`
      : `سيتم ترحيل عدد 1 غرفة. هل أنت متأكد؟`;

    if (confirm(confirmMsg)) {
      if (processRoomPosting(room, activeCity, currentData.hotelName)) {
        updateRoom(room.id, { isPosted: true, postedAmount: room.totalAmount });
        alert(isUpdate ? 'تم تحديث الترحيل المالي والمزامنة بنجاح' : 'تم ترحيل الغرفة والمزامنة بنجاح');
      }
    }
  };

  const handleSaveWithPosting = async () => {
    if (!accommodation) return;

    const allRoomIds = [
      ...(accommodation?.mecca?.rooms || []).map(r => r?.id).filter(Boolean),
      ...(accommodation?.medina?.rooms || []).map(r => r?.id).filter(Boolean)
    ];

    const orphanedTxs = (transactions || []).filter(t => 
      t && !t.isVoided && 
      t.masterTripId === selectedTripId && 
      t.roomId && 
      !allRoomIds.includes(t.roomId)
    );

    if (orphanedTxs.length > 0) {
      orphanedTxs.forEach(t => voidTransaction(t.id, true));
    }

    // الانتظار حتى اكتمال الحفظ السحابي
    await onSave(selectedTripId, accommodation);
    setIsDirty(false);

    const checkNeedPost = (r: Room, city: 'mecca' | 'medina') => {
      if (!r) return false;
      const validNamesCount = (r.names || []).filter(n => n && n.trim()).length;
      const hasContent = r.programId && validNamesCount > 0 && (r.totalAmount || 0) > 0;
      
      const existingTxsCount = (transactions || []).filter(t => 
        t && !t.isVoided && 
        t.masterTripId === selectedTripId && 
        (t.roomId === r.id || ((t.description || '').includes(`غرفة: ${r.roomNumber} - `) && (t.description || '').includes(city === 'mecca' ? 'مكة' : 'المدينة')))
      ).length;

      if (!hasContent) {
        return existingTxsCount > 0;
      }

      return !r.isPosted || (r.isPosted && r.totalAmount !== r.postedAmount) || (existingTxsCount !== validNamesCount);
    };

    const pendingRoomsMecca = (accommodation?.mecca?.rooms || []).filter(r => checkNeedPost(r, 'mecca'));
    const pendingRoomsMedina = (accommodation?.medina?.rooms || []).filter(r => checkNeedPost(r, 'medina'));
    
    const totalPending = pendingRoomsMecca.length + pendingRoomsMedina.length;

    if (totalPending > 0) {
      if (confirm(`سيتم ترحيل عدد ${totalPending} غرفة. هل تريد الحفظ والترحيل الآن؟`)) {
        let updatedAccommodation = { 
          mecca: { ...(accommodation?.mecca || { hotelName: '', rooms: [] }) },
          medina: { ...(accommodation?.medina || { hotelName: '', rooms: [] }) }
        };
        
        updatedAccommodation.mecca.rooms = (updatedAccommodation.mecca.rooms || []).map(r => {
          if (r && checkNeedPost(r, 'mecca')) {
            const success = processRoomPosting(r, 'mecca', updatedAccommodation.mecca.hotelName);
            const hasContent = r.programId && (r.names || []).filter(n => n && n.trim()).length > 0 && (r.totalAmount || 0) > 0;
            return { ...r, isPosted: hasContent && success, postedAmount: hasContent && success ? r.totalAmount : 0 };
          }
          return r;
        });

        updatedAccommodation.medina.rooms = (updatedAccommodation.medina.rooms || []).map(r => {
          if (r && checkNeedPost(r, 'medina')) {
            const success = processRoomPosting(r, 'medina', updatedAccommodation.medina.hotelName);
            const hasContent = r.programId && (r.names || []).filter(n => n && n.trim()).length > 0 && (r.totalAmount || 0) > 0;
            return { ...r, isPosted: hasContent && success, postedAmount: hasContent && success ? r.totalAmount : 0 };
          }
          return r;
        });

        setAccommodation(updatedAccommodation);
        await onSave(selectedTripId, updatedAccommodation);
        setIsDirty(false);
      }
    }
  };

  const handlePrint = () => {
    const previewContent = document.getElementById('print-section-to-copy');
    const printSection = document.getElementById('print-section');
    if (previewContent && printSection) {
      // تنظيف المحتوى القديم وتعيين المحتوى الجديد
      printSection.innerHTML = '';
      
      // نسخ المحتوى
      const content = previewContent.cloneNode(true) as HTMLElement;
      content.classList.remove('hidden', 'print:block');
      content.style.display = 'block';
      printSection.appendChild(content);
      
      // إظهار القسم مؤقتاً للطباعة
      document.body.classList.add('printing-mode');
      
      setTimeout(() => {
        window.print();
        // إعادة الإخفاء بعد انتهاء الحوار
        setTimeout(() => {
          document.body.classList.remove('printing-mode');
          printSection.style.display = 'none';
        }, 1000);
      }, 300);
    } else {
      window.print();
    }
  };

  return (
    <>
      {/* Print View - Moved outside main container to avoid potential overflow/clipping issues */}
      <div id="print-section-to-copy" className="hidden print:block p-10 bg-white font-['Cairo'] text-black" dir="rtl">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .room-card-print {
              break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        ` }} />
        {/* Print Header */}
        <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6 mb-8">
          <div className="flex items-center gap-6">
             {settings.logo && <img src={settings.logo} alt="Logo" className="w-20 h-20 object-contain" />}
             <div>
                <h1 className="text-2xl font-black text-slate-900 mb-1">{settings.name}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">كشف توزيع وتسكين الغرف الاحترافي</p>
             </div>
          </div>
          <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase mb-1">بيانات الرحلة</h2>
            <p className="text-lg font-black text-slate-900">{currentTrip?.name}</p>
            <p className="text-xs font-bold text-indigo-600 mt-1">{activeCity === 'mecca' ? 'مكة المكرمة' : 'المدينة المنورة'} - {currentTrip?.date ? new Date(currentTrip.date).toLocaleDateString('ar-EG') : 'بدون تاريخ'}</p>
          </div>
        </div>

        {/* Hotel Info Print */}
        <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-2xl mb-8 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Hotel size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-widest">فندق الإقامة</p>
              <h3 className="text-xl font-black">{currentData.hotelName || 'لم يتم تحديد الفندق'}</h3>
            </div>
          </div>
          <div className="flex gap-10 border-r border-white/20 pr-10">
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-widest">إجمالي الغرف</p>
              <h3 className="text-xl font-black">{(currentData?.rooms || []).length}</h3>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-widest">إجمالي المعتمرين</p>
              <h3 className="text-xl font-black">
                {(currentData?.rooms || []).reduce((acc, r) => acc + (r.names || []).length, 0)}
              </h3>
            </div>
          </div>
        </div>

        {/* Professional Grid Layout for Print */}
        <div className="grid grid-cols-3 gap-4">
          {(currentData?.rooms || []).map((room, rIdx) => (
            <div key={room.id} className="border border-slate-900 rounded-xl overflow-hidden bg-white flex flex-col break-inside-avoid room-card-print">
              <div className="bg-slate-900 text-white px-3 py-2 flex justify-between items-center">
                <span className="text-base font-black">غرفة {room.roomNumber || (rIdx + 1)}</span>
                <span className="text-[8px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{room.roomType}</span>
              </div>
              <div className="p-3 space-y-2 flex-1 min-h-[100px]">
                {(room.names || []).filter(n => n.trim() !== '').map((name, nIdx) => (
                  <div key={nIdx} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400 border border-slate-200">{nIdx + 1}</div>
                    <span className="text-sm font-black text-slate-800">{name}</span>
                  </div>
                ))}
              </div>
              {room.supervisorName && (
                <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 flex items-center gap-2">
                  <UserCircle size={12} className="text-slate-400" />
                  <span className="text-[8px] font-bold text-rose-600 truncate">المشرف: {room.supervisorName}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Print Footer */}
        <div className="mt-20 flex justify-between items-end">
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 font-bold mb-4">تم الاستخراج بواسطة نظام نِـبـراس ERP - {new Date().toLocaleString('ar-EG')}</p>
            <p className="text-sm font-black text-slate-900">{settings.name}</p>
            <p className="text-xs font-bold text-slate-500">{settings.address}</p>
            <p className="text-xs font-bold text-slate-500">{settings.phone}</p>
          </div>
          <div className="flex gap-20">
            <div className="text-center">
              <p className="text-xs font-bold mb-12 text-slate-400 uppercase tracking-widest">ختم الشركة</p>
              <div className="w-28 h-28 border-4 border-double border-slate-200 rounded-full"></div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold mb-12 text-slate-400 uppercase tracking-widest">التوقيع والاعتماد</p>
              <div className="w-48 border-b-2 border-slate-900"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full bg-slate-50 font-['Cairo'] print:hidden">
        {/* Header - No Print */}
        <div className="bg-white border-b border-slate-200 p-6 no-print">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">إدارة تسكين وتوزيع الغرف</h1>
                <p className="text-slate-500 text-sm font-bold">تنسيق الغرف، الأسعار، وحسابات المندوبين</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 animate-in zoom-in"
                >
                  <Trash2 size={18} />
                  حذف ({selectedIds.length})
                </button>
              )}
              <button 
                onClick={toggleSelectAll}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition-all"
              >
                <CheckCircle2 size={18} />
                {selectedIds.length === currentData.rooms.length && currentData.rooms.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
              </button>
              <button 
                onClick={addRoom}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg"
              >
                <Plus size={18} />
                غرفة جديدة
              </button>
              <button 
                onClick={copyToOtherCity}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-6 py-2.5 rounded-xl font-bold transition-all border border-indigo-200"
              >
                <Users2 size={18} />
                نسخ التوزيع إلى {activeCity === 'mecca' ? 'المدينة' : 'مكة'}
              </button>
              <button 
                onClick={handleSaveWithPosting}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                <Save size={18} />
                حفظ التسكين
              </button>
              <button 
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg"
              >
                <Search size={18} />
                معاينة الكشف
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition-all no-print"
              >
                <Printer size={18} className="text-indigo-600" />
                طباعة فورية
              </button>
            </div>
          </div>

          {/* Selection Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex-1 min-w-[250px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">الرحلة الأساسية (الأم)</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-10 py-2.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 ring-opacity-20 transition-all appearance-none"
                  value={selectedTripId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedTripId(newId);
                    if (onTripChange) onTripChange(newId);
                  }}
                >
                  {(masterTrips || []).map(t => (
                    <option key={t?.id} value={t?.id}>{t?.name} — {t?.date ? new Date(t.date).toLocaleDateString('ar-EG') : 'بدون تاريخ'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setActiveCity('mecca')}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  activeCity === 'mecca' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                مكة المكرمة
              </button>
              <button
                onClick={() => setActiveCity('medina')}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  activeCity === 'medina' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                المدينة المنورة
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-8 no-print">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Hotel Info */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Hotel size={24} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">فندق {activeCity === 'mecca' ? 'مكة المكرمة' : 'المدينة المنورة'}</label>
                  <input 
                    type="text"
                    placeholder="ادخل اسم الفندق..."
                    className="w-full bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-200"
                    value={currentData?.hotelName || ''}
                    onChange={(e) => updateHotelName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(currentData?.rooms || []).map((room) => {
                const program = (programs || []).find(p => p && p.id === room.programId);
                const isIndividualUmrah = program?.type === 'INDIVIDUAL_UMRAH';
                const isSupervisor = room.customerType === 'SUPERVISOR';
                const programCurrencyCode = program?.currencyCode || '';

                return (
                  <div 
                    key={room.id} 
                    id={`room-card-${room.id}`}
                    className={`bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col hover:border-indigo-200 transition-all group ${highlightedRoomId === room.id ? 'ring-4 ring-indigo-500 border-indigo-500 scale-[1.02] z-10 shadow-2xl' : 'border-slate-200'}`}
                  >
                    {/* Room Header - Indigo background to be extremely visible */}
                    <div className={`p-4 border-b flex items-center justify-between gap-4 transition-all ${selectedIds.includes(room.id) ? 'bg-indigo-100 border-indigo-300' : 'bg-indigo-600 text-white border-indigo-700'}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 accent-white rounded cursor-pointer"
                          checked={selectedIds.includes(room.id)}
                          onChange={() => toggleSelect(room.id)}
                        />
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white border border-white/30 shadow-inner">
                          <Bed size={20} />
                        </div>
                        
                        {/* أزرار الترتيب - واضحة جداً الآن */}
                        <div className="flex flex-col gap-0.5 bg-white/10 p-1 rounded-lg border border-white/20 shadow-sm">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveRoom(room.id, 'up'); }}
                            className="text-white hover:bg-white/20 rounded p-0.5 transition-all"
                            title="نقل لأعلى"
                          >
                            <ChevronUp size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveRoom(room.id, 'down'); }}
                            className="text-white hover:bg-white/20 rounded p-0.5 transition-all"
                            title="نقل لأسفل"
                          >
                            <ChevronDown size={18} />
                          </button>
                        </div>

                        <div className="flex-1">
                          <input 
                            type="text"
                            placeholder="رقم الغرفة"
                            className="bg-transparent font-black text-lg text-white outline-none w-full placeholder:text-white/50"
                            value={room.roomNumber}
                            onChange={(e) => updateRoom(room.id, { roomNumber: e.target.value })}
                          />
                        </div>
                        <select 
                          className="bg-white/20 text-white font-bold px-3 py-1.5 rounded-xl border border-white/30 outline-none text-sm [&>option]:text-slate-900"
                          value={room.roomType}
                          onChange={(e) => updateRoom(room.id, { roomType: e.target.value })}
                        >
                          <option value="فردي">فردي</option>
                          <option value="ثنائي">ثنائي</option>
                          <option value="ثلاثي">ثلاثي</option>
                          <option value="رباعي">رباعي</option>
                          <option value="خماسي">خماسي</option>
                          <option value="سداسي">سداسي</option>
                        </select>
                        {room.isPosted && (
                          <div className="flex items-center gap-1 bg-indigo-100 bg-opacity-20 text-indigo-100 px-3 py-1.5 rounded-xl text-[10px] font-black border border-indigo-100 border-opacity-30 animate-pulse">
                            <ShieldCheck size={14} />
                            تم الترحيل
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removeRoom(room.id)}
                        className="text-white/50 hover:text-white transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">تاريخ الترحيل (للقيود المالية)</label>
                          <input 
                            type="date"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                            value={room.postingDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => updateRoom(room.id, { postingDate: e.target.value })}
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">الرحلة الفرعية (البرنامج)</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                            value={room.programId || ''}
                            onChange={(e) => {
                              const progId = e.target.value;
                              const prog = (programs || []).find(p => p && p.id === progId);
                              const rate = (currencies || []).find(c => c && c.code === (prog?.currencyCode || ''))?.rateToMain || 1;
                              updateRoom(room.id, { programId: progId, exchangeRate: rate });
                            }}
                          >
                            <option value="">اختر البرنامج...</option>
                            {(tripPrograms || []).map(p => (
                              <option key={p?.id} value={p?.id}>{p?.name}</option>
                            ))}
                          </select>
                        </div>

                        {room.programId && programCurrencyCode !== settings?.baseCurrency && (
                          <div className="col-span-2">
                             <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block">سعر الصرف ({programCurrencyCode} مقابل {settings?.baseCurrency})</label>
                             <input 
                                type="number"
                                step="any"
                                className="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all text-indigo-700"
                                value={room.exchangeRate || (currencies || []).find(c => c && c.code === programCurrencyCode)?.rateToMain || 1}
                                onChange={(e) => updateRoom(room.id, { exchangeRate: parseFloat(e.target.value) || 0 })}
                              />
                          </div>
                        )}

                        <div className="col-span-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">اسم المشرف (إذا وجد)</label>
                           <input 
                              type="text"
                              placeholder="اسم المشرف المسؤول عن المجموعة..."
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                              value={room.supervisorName || ''}
                              onChange={(e) => updateRoom(room.id, { supervisorName: e.target.value })}
                            />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">الموظف المسؤول</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                            value={room.employeeId || ''}
                            onChange={(e) => {
                              const emp = (employees || []).find(emp => emp && emp.id === e.target.value);
                              updateRoom(room.id, { 
                                employeeId: e.target.value,
                                employeeCommissionRate: emp?.commissionRate || 0
                              });
                            }}
                          >
                            <option value="">اختر الموظف...</option>
                            {(employees || []).map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        </div>

                        {enableCostCenters && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">مركز التكلفة</label>
                            <select 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                              value={room.costCenterId || ''}
                              onChange={(e) => updateRoom(room.id, { costCenterId: e.target.value })}
                            >
                              <option value="">بدون مركز تكلفة</option>
                              {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
                                <option key={cc?.id} value={cc?.id}>{cc?.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">نسبة العمولة %</label>
                          <input 
                            type="number"
                            step="0.1"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all text-center"
                            value={room.employeeCommissionRate || 0}
                            onChange={(e) => updateRoom(room.id, { employeeCommissionRate: parseFloat(e.target.value) || 0, commissionAmount: 0 })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">عمولة ثابتة (اختياري)</label>
                          <input 
                            type="number"
                            className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:bg-white focus:border-emerald-200 transition-all text-center text-emerald-700"
                            placeholder="مبلغ محدد"
                            value={room.commissionAmount || ''}
                            onChange={(e) => updateRoom(room.id, { commissionAmount: parseFloat(e.target.value) || 0, employeeCommissionRate: 0 })}
                          />
                        </div>
                      </div>

                      {/* Pricing Section */}
                      {!isSupervisor && (
                        <div className="bg-indigo-50 bg-opacity-50 p-4 rounded-2xl border border-indigo-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <label className="text-[10px] font-bold text-indigo-600 uppercase">نظام التسعير</label>
                               <button 
                                 onClick={() => postRoomFinancials(room)}
                                 disabled={room.isPosted}
                                 className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${room.isPosted ? 'bg-indigo-100 text-indigo-600 opacity-50' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-200'}`}
                               >
                                 {room.isPosted ? 'تم الترحيل' : 'ترحيل مالي منفرد'}
                               </button>
                            </div>
                            <div className="flex bg-white/80 p-0.5 rounded-lg border border-slate-200 shadow-sm">
                              <button 
                                onClick={() => updateRoom(room.id, { pricingMode: 'PER_PERSON' })}
                                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${room.pricingMode === 'PER_PERSON' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                              >للفرد</button>
                              <button 
                                onClick={() => updateRoom(room.id, { pricingMode: 'TOTAL' })}
                                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${room.pricingMode === 'TOTAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                              >للغرفة</button>
                              <button 
                                onClick={() => updateRoom(room.id, { pricingMode: 'INDIVIDUAL' })}
                                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${room.pricingMode === 'INDIVIDUAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                              >مخصص</button>
                            </div>
                          </div>

                          {room.pricingMode !== 'INDIVIDUAL' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">سعر البيع {room.pricingMode === 'PER_PERSON' ? '(للفرد)' : '(للكل)'}</label>
                                <div className="relative">
                                  <input 
                                    type="number"
                                    className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm font-black text-emerald-700 outline-none focus:border-emerald-300 focus:bg-white transition-all"
                                    value={room.sellingPrice || ''}
                                    onChange={(e) => updateRoom(room.id, { sellingPrice: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">سعر الشراء {room.pricingMode === 'PER_PERSON' ? '(للفرد)' : '(للكل)'}</label>
                                <div className="relative">
                                  <input 
                                    type="number"
                                    className="w-full bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-sm font-black text-rose-700 outline-none focus:border-rose-300 focus:bg-white transition-all"
                                    value={room.purchasePrice || ''}
                                    onChange={(e) => updateRoom(room.id, { purchasePrice: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="text-[8px] font-black text-rose-500 uppercase mb-1 block">خصم على الغرفة</label>
                              <div className="relative">
                                <input 
                                  type="number"
                                  className="w-full bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-sm font-black text-rose-700 outline-none focus:border-rose-300 focus:bg-white transition-all"
                                  value={room.discount || ''}
                                  onChange={(e) => updateRoom(room.id, { discount: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
                            <span className="text-xs font-bold text-slate-500">إجمالي مطالبة الغرفة:</span>
                            <span className="text-lg font-black text-indigo-600">{room.totalAmount?.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">{programs.find(p => p.id === room.programId)?.currencyCode}</span></span>
                          </div>
                        </div>
                      )}

                      {/* Names List */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">توزيع المعتمرين والارتباط المالي</label>
                        {(room.names || []).map((name, idx) => {
                          const occupantData = room.occupantEntities?.[idx] || { customerType: 'DIRECT' };
                          return (
                            <div key={idx} className="space-y-2 bg-slate-50 bg-opacity-50 p-3 rounded-2xl border border-slate-100 group/row">
                              <div className="flex items-center gap-3">
                                <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                                  <button 
                                    onClick={() => {
                                      const newEntities = { ...room.occupantEntities };
                                      newEntities[idx] = { ...occupantData, personType: 'ADULT' };
                                      updateRoom(room.id, { occupantEntities: newEntities });
                                    }}
                                    className={`px-2 py-1 rounded-md text-[8px] font-black transition-all ${(!occupantData.personType || occupantData.personType === 'ADULT') ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                                  >بالغ</button>
                                  <button 
                                    onClick={() => {
                                      const newEntities = { ...room.occupantEntities };
                                      newEntities[idx] = { ...occupantData, personType: 'CHILD' };
                                      updateRoom(room.id, { occupantEntities: newEntities });
                                    }}
                                    className={`px-2 py-1 rounded-md text-[8px] font-black transition-all ${occupantData.personType === 'CHILD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                                  >طفل</button>
                                  <button 
                                    onClick={() => {
                                      const newEntities = { ...room.occupantEntities };
                                      newEntities[idx] = { ...occupantData, personType: 'INFANT' };
                                      updateRoom(room.id, { occupantEntities: newEntities });
                                    }}
                                    className={`px-2 py-1 rounded-md text-[8px] font-black transition-all ${occupantData.personType === 'INFANT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                                  >رضيع</button>
                                </div>
                                <input 
                                  type="text"
                                  placeholder="اسم المعتمر..."
                                  className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-300 transition-all"
                                  value={name}
                                  onChange={(e) => {
                                    const newNames = [...room.names];
                                    newNames[idx] = e.target.value;
                                    updateRoom(room.id, { names: newNames });
                                  }}
                                />
                                <button 
                                  onClick={() => removeName(room.id, idx)}
                                  className="text-slate-300 hover:text-rose-400 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 gap-3 pl-6">
                                <div className="flex bg-white/80 p-0.5 rounded-lg border border-slate-200">
                                  <button 
                                    onClick={() => {
                                      const newEntities = { ...room.occupantEntities };
                                      newEntities[idx] = { ...occupantData, customerType: 'DIRECT', agentId: '', agentName: '' };
                                      updateRoom(room.id, { occupantEntities: newEntities });
                                    }}
                                    className={`flex-1 py-1 rounded-md text-[9px] font-black transition-all ${occupantData.customerType === 'DIRECT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                  >مباشر</button>
                                  <button 
                                    onClick={() => {
                                      const newEntities = { ...room.occupantEntities };
                                      newEntities[idx] = { ...occupantData, customerType: 'AGENT' };
                                      updateRoom(room.id, { occupantEntities: newEntities });
                                    }}
                                    className={`flex-1 py-1 rounded-md text-[9px] font-black transition-all ${occupantData.customerType === 'AGENT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                  >مندوب</button>
                                  <button 
                                    onClick={() => {
                                      const newEntities = { ...room.occupantEntities };
                                      newEntities[idx] = { ...occupantData, customerType: 'SUPPLIER' };
                                      updateRoom(room.id, { occupantEntities: newEntities });
                                    }}
                                    className={`flex-1 py-1 rounded-md text-[9px] font-black transition-all ${occupantData.customerType === 'SUPPLIER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                  >مورد</button>
                                  <button 
                                    onClick={() => {
                                      const newEntities = { ...room.occupantEntities };
                                      newEntities[idx] = { ...occupantData, customerType: 'SUPERVISOR', agentId: '', agentName: '' };
                                      updateRoom(room.id, { occupantEntities: newEntities });
                                    }}
                                    className={`flex-1 py-1 rounded-md text-[9px] font-black transition-all ${occupantData.customerType === 'SUPERVISOR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                  >مشرف</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="relative h-[32px]">
                                    {occupantData.customerType === 'AGENT' && (
                                      <SearchableSelect
                                        options={(customers || []).map(c => ({ id: c.id, name: c.name }))}
                                        value={occupantData.agentId || ''}
                                        onChange={(id, name) => {
                                          const newEntities = { ...(room.occupantEntities || {}) };
                                          newEntities[idx] = { ...occupantData, agentId: id, agentName: name };
                                          updateRoom(room.id, { occupantEntities: newEntities });
                                        }}
                                        placeholder="اختر المندوب..."
                                        className="text-[10px]"
                                      />
                                    )}
                                    {occupantData.customerType === 'SUPPLIER' && (
                                      <SearchableSelect
                                        options={(suppliers || []).map(s => ({ id: s.id, name: s.name }))}
                                        value={occupantData.agentId || ''}
                                        onChange={(id, name) => {
                                          const newEntities = { ...(room.occupantEntities || {}) };
                                          newEntities[idx] = { ...occupantData, agentId: id, agentName: name };
                                          updateRoom(room.id, { occupantEntities: newEntities });
                                        }}
                                        placeholder="اختر المورد..."
                                        className="text-[10px]"
                                      />
                                    )}
                                  </div>

                                  {room.pricingMode === 'INDIVIDUAL' ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      <input 
                                        type="number"
                                        placeholder="بيع"
                                        className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-black outline-none"
                                        value={occupantData.sellingPrice || ''}
                                        onChange={(e) => {
                                          const newEntities = { ...(room.occupantEntities || {}) };
                                          newEntities[idx] = { ...occupantData, sellingPrice: parseFloat(e.target.value) || 0 };
                                          updateRoom(room.id, { occupantEntities: newEntities });
                                        }}
                                      />
                                      <input 
                                        type="number"
                                        placeholder="شراء"
                                        className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-black outline-none"
                                        value={occupantData.purchasePrice || ''}
                                        onChange={(e) => {
                                          const newEntities = { ...(room.occupantEntities || {}) };
                                          newEntities[idx] = { ...occupantData, purchasePrice: parseFloat(e.target.value) || 0 };
                                          updateRoom(room.id, { occupantEntities: newEntities });
                                        }}
                                      />
                                      <input 
                                        type="number"
                                        placeholder="خصم فردي"
                                        className="w-full bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg text-[10px] font-black outline-none text-rose-600"
                                        value={occupantData.discount || ''}
                                        onChange={(e) => {
                                          const newEntities = { ...(room.occupantEntities || {}) };
                                          newEntities[idx] = { ...occupantData, discount: parseFloat(e.target.value) || 0 };
                                          updateRoom(room.id, { occupantEntities: newEntities });
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex justify-end">
                                      <div className="w-1/2">
                                        <input 
                                          type="number"
                                          placeholder="خصم خاص للفرد"
                                          className="w-full bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg text-[10px] font-black outline-none text-rose-600"
                                          value={occupantData.discount || ''}
                                          onChange={(e) => {
                                            const newEntities = { ...(room.occupantEntities || {}) };
                                            newEntities[idx] = { ...occupantData, discount: parseFloat(e.target.value) || 0 };
                                            updateRoom(room.id, { occupantEntities: newEntities });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <button 
                          onClick={() => addNameRow(room.id)}
                          className="w-full py-2 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                          <UserPlus size={16} />
                          إضافة معتمر للغرفة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Print Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col scale-in-center">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 bg-opacity-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Printer size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">معاينة كشف التوزيع</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">تأكد من البيانات قبل الطباعة</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    <Printer size={20} />
                    طباعة الكشف
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-12 bg-slate-100 bg-opacity-50">
                 <div className="bg-white shadow-2xl rounded-[2rem] mx-auto p-12 min-h-[1000px] border border-slate-200 relative overflow-hidden">
                    {/* Watermark/Background Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0 opacity-50"></div>
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b-4 border-slate-900 pb-8 mb-10">
                        <div className="flex items-center gap-8">
                           {settings.logo && <img src={settings.logo} alt="Logo" className="w-24 h-24 object-contain drop-shadow-sm" />}
                           <div>
                              <h1 className="text-3xl font-black text-slate-900 mb-1">{settings.name}</h1>
                              <div className="flex items-center gap-2">
                                <span className="h-1 w-8 bg-indigo-600 rounded-full"></span>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">كشف تسكين الغرف المعتمد</p>
                              </div>
                           </div>
                        </div>
                        <div className="text-left bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                          <h2 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter">معلومات الرحلة</h2>
                          <p className="text-xl font-black text-slate-900 mb-1">{currentTrip?.name}</p>
                          <div className="flex items-center gap-3 justify-end">
                             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">{activeCity === 'mecca' ? 'مكة المكرمة' : 'المدينة المنورة'}</span>
                             <span className="text-xs font-bold text-slate-400">{currentTrip?.date ? new Date(currentTrip.date).toLocaleDateString('ar-EG') : 'بدون تاريخ'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Cards */}
                      <div className="grid grid-cols-2 gap-6 mb-10">
                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                           <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                           <div className="flex items-center gap-6 relative z-10">
                              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20">
                                <Hotel size={32} className="text-white" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">فندق الإقامة والتبعية</p>
                                <h3 className="text-2xl font-black">{currentData.hotelName || 'لم يتم تحديد الفندق'}</h3>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] text-center hover:border-indigo-100 transition-all">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">إجمالي الغرف</p>
                              <h3 className="text-4xl font-black text-slate-900">{(currentData?.rooms || []).length}</h3>
                           </div>
                           <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] text-center hover:border-indigo-100 transition-all">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">إجمالي الأفراد</p>
                              <h3 className="text-4xl font-black text-indigo-600">
                                {(currentData?.rooms || []).reduce((acc, r) => acc + (r.names || []).length, 0)}
                              </h3>
                           </div>
                        </div>
                      </div>

                      {/* Rooms Layout */}
                      <div className="grid grid-cols-3 gap-6">
                        {(currentData?.rooms || []).map((room, rIdx) => (
                          <div key={room.id} className="border-2 border-slate-900 rounded-[2rem] overflow-hidden bg-white flex flex-col shadow-sm hover:shadow-md transition-all">
                            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Bed size={16} className="text-indigo-400" />
                                <span className="text-lg font-black tracking-tight">غرفة {room.roomNumber || (rIdx + 1)}</span>
                              </div>
                              <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full border border-white/10 uppercase">
                                {room.roomType}
                              </span>
                            </div>
                            <div className="p-3 space-y-2 flex-1">
                              {(room.names || []).filter(n => n.trim() !== '').map((name, nIdx) => (
                                <div key={nIdx} className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400 border border-slate-200">{nIdx + 1}</div>
                                  <span className="text-sm font-black text-slate-800">{name}</span>
                                </div>
                              ))}
                              {(room.names || []).filter(n => n.trim() !== '').length === 0 && (
                                <div className="text-slate-300 text-[10px] italic py-3 text-center">غرفة فارغة</div>
                              )}
                            </div>
                            {room.supervisorName && (
                              <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 flex items-center gap-2">
                                <UserCircle size={12} className="text-slate-400" />
                                <span className="text-[8px] font-bold text-rose-600 truncate">المشرف: {room.supervisorName}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Footer Signature */}
                      <div className="mt-20 flex justify-between px-10">
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">ختم الشركة المعتمد</p>
                          <div className="w-24 h-24 border-4 border-double border-slate-200 rounded-full mx-auto flex items-center justify-center text-[8px] text-slate-200 font-bold">STAMP HERE</div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">توقيع مدير العمليات</p>
                          <div className="w-48 border-b-2 border-slate-900 pt-10"></div>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AccommodationView;
