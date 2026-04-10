
export interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
  short_name: string;
  support: number;
  isTransfer: number;
  swift_code: string;
}

export const fetchBanks = async (): Promise<Bank[]> => {
  try {
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const result = await response.json();
    if (result.code === '00') {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
};

// Fallback list of major banks in case the API fails
export const MAJOR_BANKS = [
  { name: "MB Bank", bin: "970422", shortName: "MB" },
  { name: "Vietcombank", bin: "970436", shortName: "VCB" },
  { name: "Techcombank", bin: "970407", shortName: "TCB" },
  { name: "VietinBank", bin: "970415", shortName: "CTG" },
  { name: "BIDV", bin: "970418", shortName: "BIDV" },
  { name: "Agribank", bin: "970405", shortName: "VBA" },
  { name: "VPBank", bin: "970432", shortName: "VPB" },
  { name: "TPBank", bin: "970423", shortName: "TPB" },
  { name: "Sacombank", bin: "970403", shortName: "STB" },
  { name: "ACB", bin: "970416", shortName: "ACB" },
  { name: "HDBank", bin: "970437", shortName: "HDB" },
  { name: "VIB", bin: "970441", shortName: "VIB" },
  { name: "SHB", bin: "970443", shortName: "SHB" },
  { name: "Eximbank", bin: "970431", shortName: "EIB" },
  { name: "MSB", bin: "970426", shortName: "MSB" },
  { name: "SeABank", bin: "970440", shortName: "SEA" },
  { name: "OCB", bin: "970448", shortName: "OCB" },
  { name: "LienVietPostBank", bin: "970449", shortName: "LPB" },
  { name: "Bac A Bank", bin: "970409", shortName: "BAB" },
  { name: "PVcomBank", bin: "970412", shortName: "PVC" }
];
