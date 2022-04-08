import { providers } from "near-api-js";

import { Provider, Logger, PersistentStorage, Emitter } from "../services";
import { Transaction } from "./transactions";
import { Action } from "./actions";
import { Options } from "../options.types";
import { Optional } from "../utils.types";
import { AccountState } from "../store.types";

export interface HardwareWalletConnectParams {
  accountId: string;
  derivationPath: string;
}

export interface SignAndSendTransactionParams {
  signerId?: string;
  receiverId?: string;
  actions: Array<Action>;
}

export interface SignAndSendTransactionsParams {
  transactions: Array<Optional<Transaction, "signerId">>;
}

export type WalletEvents = {
  init: { accounts: Array<AccountState> };
  connected: { pending?: boolean; accounts?: Array<AccountState> };
  disconnected: null;
  accountsChanged: { accounts: Array<AccountState> };
  networkChanged: null;
  uninstalled: null;
};

interface WalletMetadata<Type extends string = string> {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string;
  type: Type;
}

interface BaseWalletBehaviour<ExecutionOutcome> {
  // Initialise an SDK or load data from a source such as local storage.
  init(): Promise<void>;

  // Determines if the wallet is available for selection.
  isAvailable(): boolean;

  // Requests sign in for the given wallet.
  // Note: Hardware wallets should defer HID connection until user input is required (e.g. public key or signing).
  connect(params?: object): Promise<void>;

  // Removes connection to the wallet and triggers a cleanup of subscriptions etc.
  disconnect(): Promise<void>;

  // Signs a list of actions before sending them via an RPC endpoint.
  signAndSendTransaction(
    params: SignAndSendTransactionParams
  ): Promise<ExecutionOutcome>;

  // Sings a list of transactions before sending them via an RPC endpoint.
  signAndSendTransactions(
    params: SignAndSendTransactionsParams
  ): Promise<ExecutionOutcome extends void ? void : Array<ExecutionOutcome>>;
}

export type BrowserWalletBehaviour = BaseWalletBehaviour<void>;

export type BrowserWallet = WalletMetadata<"browser"> & BrowserWalletBehaviour;

export interface InjectedWalletBehaviour
  extends BaseWalletBehaviour<providers.FinalExecutionOutcome> {
  getDownloadUrl(): string;
}

export type InjectedWallet = WalletMetadata<"injected"> &
  InjectedWalletBehaviour;

export interface HardwareWalletBehaviour
  extends BaseWalletBehaviour<providers.FinalExecutionOutcome> {
  connect(params: HardwareWalletConnectParams): Promise<void>;
}

export type HardwareWallet = WalletMetadata<"hardware"> &
  HardwareWalletBehaviour;

export type BridgeWalletBehaviour =
  BaseWalletBehaviour<providers.FinalExecutionOutcome>;

export type BridgeWallet = WalletMetadata<"bridge"> & BridgeWalletBehaviour;

export type Wallet =
  | BrowserWallet
  | InjectedWallet
  | HardwareWallet
  | BridgeWallet;

export type WalletType = Wallet["type"];

export interface WalletOptions {
  options: Options;
  provider: Provider;
  emitter: Emitter<WalletEvents>;
  logger: Logger;
  storage: PersistentStorage;
}

export type BrowserWalletModule = WalletMetadata<"browser"> & {
  wallet(options: WalletOptions): BrowserWalletBehaviour;
};

export type InjectedWalletModule = WalletMetadata<"injected"> & {
  wallet(options: WalletOptions): InjectedWalletBehaviour;
};

export type HardwareWalletModule = WalletMetadata<"hardware"> & {
  wallet(options: WalletOptions): HardwareWalletBehaviour;
};

export type BridgeWalletModule = WalletMetadata<"bridge"> & {
  wallet(options: WalletOptions): BridgeWalletBehaviour;
};

export type WalletModule =
  | BrowserWalletModule
  | InjectedWalletModule
  | HardwareWalletModule
  | BridgeWalletModule;
