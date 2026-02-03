import { Program, UmrahComponent, Currency } from '../types';

export type RoomType = 'DEFAULT' | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';

export const getEffectiveRate = (entity: any, currencyCode: string, currencies: Currency[]) => {
  const openingBal = (entity as any)?.openingBalance || 0;
  const openingBalBase = (entity as any)?.openingBalanceInBase || 0;
  if (openingBal !== 0 && (entity as any)?.openingBalanceCurrency === currencyCode) {
    return openingBalBase / (openingBal || 1);
  }
  return (currencies || []).find(c => c.code === currencyCode)?.rateToMain || 1;
};

export const getPriceByRoomType = (
  item: Program | UmrahComponent,
  roomType: RoomType,
  priceField: 'sellingPrice' | 'purchasePrice' | 'adultSellingPrice' | 'adultPurchasePrice' | 'childSellingPrice' | 'childPurchasePrice' | 'infantSellingPrice' | 'infantPurchasePrice' | 'singleSellingPrice' | 'singlePurchasePrice' | 'doubleSellingPrice' | 'doublePurchasePrice' | 'tripleSellingPrice' | 'triplePurchasePrice' | 'quadSellingPrice' | 'quadPurchasePrice' | 'singleChildSellingPrice' | 'singleChildPurchasePrice' | 'doubleChildSellingPrice' | 'doubleChildPurchasePrice' | 'tripleChildSellingPrice' | 'tripleChildPurchasePrice' | 'quadChildSellingPrice' | 'quadChildPurchasePrice' | 'singleInfantSellingPrice' | 'singleInfantPurchasePrice' | 'doubleInfantSellingPrice' | 'doubleInfantPurchasePrice' | 'tripleInfantSellingPrice' | 'tripleInfantPurchasePrice' | 'quadInfantSellingPrice' | 'quadInfantPurchasePrice',
  fallbackField: string
): number => {
  const val = (item as any)[priceField];
  if (val !== undefined && val !== null && val !== '') return parseFloat(val.toString());
  
  const fallback = (item as any)[fallbackField];
  return parseFloat(fallback?.toString() || '0');
};

export const calculateTripPricing = (
  trip: Program,
  roomType: RoomType,
  counts: { adult: number; child: number; infant: number; supervisor: number }
) => {
  const adultSelling = 
    roomType === 'SINGLE' ? getPriceByRoomType(trip, roomType, 'singleSellingPrice', 'adultSellingPrice') || getPriceByRoomType(trip, roomType, 'adultSellingPrice', 'sellingPrice') :
    roomType === 'DOUBLE' ? getPriceByRoomType(trip, roomType, 'doubleSellingPrice', 'adultSellingPrice') || getPriceByRoomType(trip, roomType, 'adultSellingPrice', 'sellingPrice') :
    roomType === 'TRIPLE' ? getPriceByRoomType(trip, roomType, 'tripleSellingPrice', 'adultSellingPrice') || getPriceByRoomType(trip, roomType, 'adultSellingPrice', 'sellingPrice') :
    roomType === 'QUAD' ? getPriceByRoomType(trip, roomType, 'quadSellingPrice', 'adultSellingPrice') || getPriceByRoomType(trip, roomType, 'adultSellingPrice', 'sellingPrice') :
    getPriceByRoomType(trip, roomType, 'adultSellingPrice', 'sellingPrice');

  const childSelling = 
    roomType === 'SINGLE' ? getPriceByRoomType(trip, roomType, 'singleChildSellingPrice', 'childSellingPrice') :
    roomType === 'DOUBLE' ? getPriceByRoomType(trip, roomType, 'doubleChildSellingPrice', 'childSellingPrice') :
    roomType === 'TRIPLE' ? getPriceByRoomType(trip, roomType, 'tripleChildSellingPrice' as any, 'childSellingPrice') : // Fix typo if any
    roomType === 'QUAD' ? getPriceByRoomType(trip, roomType, 'quadChildSellingPrice', 'childSellingPrice') :
    getPriceByRoomType(trip, roomType, 'childSellingPrice', '');

  // ... this is getting complex. Let's simplify the utility to be more robust.
  
  const getVal = (f: string) => parseFloat((trip as any)[f]?.toString() || '0');

  let aS = getVal('adultSellingPrice') || getVal('sellingPrice');
  let cS = getVal('childSellingPrice');
  let iS = getVal('infantSellingPrice');
  let aP = getVal('adultPurchasePrice') || getVal('purchasePrice');
  let cP = getVal('childPurchasePrice');
  let iP = getVal('infantPurchasePrice');

  if (roomType === 'SINGLE') {
    aS = getVal('singleSellingPrice') || aS;
    cS = getVal('singleChildSellingPrice') || cS;
    iS = getVal('singleInfantSellingPrice') || iS;
    aP = getVal('singlePurchasePrice') || aP;
    cP = getVal('singleChildPurchasePrice') || cP;
    iP = getVal('singleInfantPurchasePrice') || iP;
  } else if (roomType === 'DOUBLE') {
    aS = getVal('doubleSellingPrice') || aS;
    cS = getVal('doubleChildSellingPrice') || cS;
    iS = getVal('doubleInfantSellingPrice') || iS;
    aP = getVal('doublePurchasePrice') || aP;
    cP = getVal('doubleChildPurchasePrice') || cP;
    iP = getVal('doubleInfantPurchasePrice') || iP;
  } else if (roomType === 'TRIPLE') {
    aS = getVal('tripleSellingPrice') || aS;
    cS = getVal('tripleChildSellingPrice') || cS;
    iS = getVal('tripleInfantSellingPrice') || iS;
    aP = getVal('triplePurchasePrice') || aP;
    cP = getVal('tripleChildPurchasePrice') || cP;
    iP = getVal('tripleInfantPurchasePrice') || iP;
  } else if (roomType === 'QUAD') {
    aS = getVal('quadSellingPrice') || aS;
    cS = getVal('quadChildSellingPrice') || cS;
    iS = getVal('quadInfantSellingPrice') || iS;
    aP = getVal('quadPurchasePrice') || aP;
    cP = getVal('quadChildPurchasePrice') || cP;
    iP = getVal('quadInfantPurchasePrice') || iP;
  }

  const totalSelling = (counts.adult * aS) + (counts.child * cS) + (counts.infant * iS);
  const totalPurchase = (counts.adult * aP) + (counts.child * cP) + (counts.infant * iP) + (counts.supervisor * aP);

  return { totalSelling, totalPurchase, adultSelling: aS, adultPurchase: aP, childSelling: cS, childPurchase: cP, infantSelling: iS, infantPurchase: iP };
};

export const calculateComponentPricing = (
  comp: UmrahComponent,
  roomType: RoomType,
  counts: { adult: number; child: number; infant: number; supervisor: number }
) => {
  const getVal = (f: string) => parseFloat((comp as any)[f]?.toString() || '0');
  
  let aS = getVal('adultSellingPrice') || getVal('sellingPrice');
  let cS = getVal('childSellingPrice');
  let iS = getVal('infantSellingPrice');
  let aP = getVal('adultPurchasePrice') || getVal('purchasePrice');
  let cP = getVal('childPurchasePrice');
  let iP = getVal('infantPurchasePrice');

  if (roomType === 'SINGLE') {
    aS = getVal('singleSellingPrice') || aS;
    cS = getVal('singleChildSellingPrice') || cS;
    iS = getVal('singleInfantSellingPrice') || iS;
    aP = getVal('singlePurchasePrice') || aP;
    cP = getVal('singleChildPurchasePrice') || cP;
    iP = getVal('singleInfantPurchasePrice') || iP;
  } else if (roomType === 'DOUBLE') {
    aS = getVal('doubleSellingPrice') || aS;
    cS = getVal('doubleChildSellingPrice') || cS;
    iS = getVal('doubleInfantSellingPrice') || iS;
    aP = getVal('doublePurchasePrice') || aP;
    cP = getVal('doubleChildPurchasePrice') || cP;
    iP = getVal('doubleInfantPurchasePrice') || iP;
  } else if (roomType === 'TRIPLE') {
    aS = getVal('tripleSellingPrice') || aS;
    cS = getVal('tripleChildSellingPrice') || cS;
    iS = getVal('tripleInfantSellingPrice') || iS;
    aP = getVal('triplePurchasePrice') || aP;
    cP = getVal('tripleChildPurchasePrice') || cP;
    iP = getVal('tripleInfantPurchasePrice') || iP;
  } else if (roomType === 'QUAD') {
    aS = getVal('quadSellingPrice') || aS;
    cS = getVal('quadChildSellingPrice') || cS;
    iS = getVal('quadInfantSellingPrice') || iS;
    aP = getVal('quadPurchasePrice') || aP;
    cP = getVal('quadChildPurchasePrice') || cP;
    iP = getVal('quadInfantPurchasePrice') || iP;
  }

  const selling = (counts.adult * aS) + (counts.child * cS) + (counts.infant * iS);
  const purchase = (counts.adult * aP) + (counts.child * cP) + (counts.infant * iP) + (counts.supervisor * aP);

  return { selling, purchase, adultSelling: aS, adultPurchase: aP };
};
