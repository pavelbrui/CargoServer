export type Timestamp = unknown
export type AnyObject = unknown
export type Date = unknown

export enum CountryPairs {
  USA_RU = "USA_RU",
  USA_PL = "USA_PL",
  CAN_PL = "CAN_PL",
  CAN_BY = "CAN_BY",
  CAN_RU = "CAN_RU",
  USA_BY = "USA_BY"
}
export enum CountryCurrency {
  USD = "USD",
  PLN = "PLN",
  BYR = "BYR",
  RUB = "RUB"
}
export enum Unit {
  KG = "KG"
}
export enum OwnerType {
  BISNES = "BISNES",
  PRIVAT = "PRIVAT"
}
export enum DeliveryType {
  SEA = "SEA",
  AIR = "AIR",
  TRAIN = "TRAIN"
}
export enum Country {
  USA = "USA",
  BY = "BY",
  RU = "RU",
  PL = "PL",
  CAN = "CAN"
}
export enum ChangePasswordWithTokenError {
  CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
  TOKEN_IS_INVALID = "TOKEN_IS_INVALID",
  PASSWORD_IS_TOO_WEAK = "PASSWORD_IS_TOO_WEAK"
}
export enum OrderStatus {
  DRAFT = "DRAFT",
  CREATED = "CREATED",
  ACCEPTED = "ACCEPTED",
  WAITING = "WAITING",
  TAKEN = "TAKEN",
  DENIED = "DENIED",
  DRIVING = "DRIVING",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  NOT_DELIVERED = "NOT_DELIVERED"
}
export enum SortField {
  CREATED_AT = "CREATED_AT",
  UPDATED_AT = "UPDATED_AT",
  STATUS = "STATUS",
  DIRECTION = "DIRECTION",
  DELIVERY_TYPE = "DELIVERY_TYPE",
  TOTAL_PRICE = "TOTAL_PRICE"
}
export enum RegisterErrors {
  USERNAME_EXISTS = "USERNAME_EXISTS",
  PASSWORD_WEAK = "PASSWORD_WEAK",
  INVITE_DOMAIN_INCORRECT = "INVITE_DOMAIN_INCORRECT",
  LINK_EXPIRED = "LINK_EXPIRED",
  USERNAME_INVALID = "USERNAME_INVALID"
}
export enum VerifyEmailError {
  TOKEN_CANNOT_BE_FOUND = "TOKEN_CANNOT_BE_FOUND"
}
export enum LoginErrors {
  CONFIRM_EMAIL_BEFOR_LOGIN = "CONFIRM_EMAIL_BEFOR_LOGIN",
  INVALID_LOGIN_OR_PASSWORD = "INVALID_LOGIN_OR_PASSWORD",
  CANNOT_FIND_CONNECTED_USER = "CANNOT_FIND_CONNECTED_USER",
  YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL = "YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
}
export enum Platform {
  ANDROID = "ANDROID",
  WEB = "WEB",
  IOS = "IOS"
}
export enum OrderPriority {
  LOW = "LOW",
  MID = "MID",
  TOP = "TOP"
}
export enum EditUserError {
  USERNAME_ALREADY_TAKEN = "USERNAME_ALREADY_TAKEN",
  FAILED_MONGO_UPDATE = "FAILED_MONGO_UPDATE",
  USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST"
}
export enum ProviderErrors {
  CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN = "CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN",
  CANNOT_FIND_EMAIL_FOR_THIS_PROFIL = "CANNOT_FIND_EMAIL_FOR_THIS_PROFIL",
  CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE",
  CODE_IS_NOT_EXIST_IN_ARGS = "CODE_IS_NOT_EXIST_IN_ARGS",
  CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN = "CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN",
  CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT = "CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT"
}

export interface UpdateUserInput {
  username: string;
  fullName?: string | undefined;
  phone?: string | undefined;
  emailForMails?: string | undefined;
}
export interface ProviderLoginInput {
  code: string;
}
export interface SimpleUserInput {
  username: string;
  password: string;
}
export interface LoginInput {
  username: string;
  password: string;
}
export interface SendTeamInvitationInput {
  username: string;
  teamId: string;
  roles: Array<string>;
}
export interface VerifyEmailInput {
  token: string;
}
export interface InviteTokenInput {
  expires?: string | undefined;
  domain?: string | undefined;
  teamId?: string | undefined;
  roles: Array<string>;
}
export interface ChangePasswordWithTokenInput {
  username: string;
  forgotToken: string;
  newPassword: string;
}
export interface ChangePasswordWhenLoggedInput {
  username: string;
  oldPassword: string;
  newPassword: string;
}
export interface RegisterInput {
  fullName?: string | undefined;
  username: string;
  password: string;
  invitationToken?: string | undefined;
}
export interface CalculateOrderInput {
  direction?: CountryPairs | undefined;
  paymentFrom?: CountryCurrency | undefined;
  unit?: Unit | undefined;
  deliveryType?: DeliveryType | undefined;
  ownerType?: OwnerType | undefined;
  dimensions?: Array<DimensionInput | undefined> | undefined;
  fromDoor?: boolean | undefined;
  toDoor?: boolean | undefined;
}
export interface DimensionInput {
  length?: number | undefined;
  high?: number | undefined;
  width?: number | undefined;
  wight?: number | undefined;
}
export interface UpdateOrderInput {
  status?: OrderStatus | undefined;
  from?: AddressAddInput | undefined;
  to?: AddressAddInput | undefined;
  deliveryType?: DeliveryType | undefined;
  ownerType?: OwnerType | undefined;
  totalPrice: number;
  addElements?: Array<DimensionInput> | undefined;
  removeElement?: number | undefined;
  fromDoor?: boolean | undefined;
  toDoor?: boolean | undefined;
}
export interface DraftOrderInput {
  from?: AddressAddInput | undefined;
  to?: AddressAddInput | undefined;
  deliveryType?: DeliveryType | undefined;
  ownerType?: OwnerType | undefined;
  totalPrice?: number | undefined;
  elements?: Array<DimensionInput | undefined> | undefined;
  fromDoor?: boolean | undefined;
  toDoor?: boolean | undefined;
}
export interface SendOrderInput {
  from: AddressAddInput;
  to: AddressAddInput;
  deliveryType: DeliveryType;
  ownerType: OwnerType;
  totalPrice: number;
  elements: Array<DimensionInput>;
  fromDoor?: boolean | undefined;
  toDoor?: boolean | undefined;
}
export interface CreateOrderAdminInput {
  clientId: string;
  from: AddressAddInput;
  to: AddressAddInput;
  deliveryType: DeliveryType;
  ownerType: OwnerType;
  totalPrice: number;
  elements: Array<DimensionInput>;
  fromDoor?: boolean | undefined;
  toDoor?: boolean | undefined;
}
export interface AddressAddInput {
  flat?: string | undefined;
  phone?: string | undefined;
  addressGoogleString: string;
}
export interface TimestampFilter {
  Gt?: Timestamp | undefined;
  Gte?: Timestamp | undefined;
  Lt?: Timestamp | undefined;
  Lte?: Timestamp | undefined;
}
export interface SortInput {
  field: SortField;
  order?: boolean | undefined;
}
export interface PeriodInput {
  to: string;
  from: string;
}
export interface PageOptions {
  limit?: number | undefined;
  cursorId?: string | undefined;
}
export interface AdminOrderFilter {
  clientId?: string | undefined;
  searchString?: string | undefined;
  paymentFrom?: CountryCurrency | undefined;
  status?: Array<OrderStatus> | undefined;
  paid?: boolean | undefined;
  direction?: Array<CountryPairs | undefined> | undefined;
  units?: Unit | undefined;
  deliveryType?: DeliveryType | undefined;
  ownerType?: OwnerType | undefined;
  fromDoor?: boolean | undefined;
  toDoor?: boolean | undefined;
}
export interface OrderFilter {
  searchString?: string | undefined;
  period?: PeriodInput | undefined;
  paginate?: PageOptions | undefined;
  sort?: SortOrdersInput | undefined;
  status?: Array<OrderStatus> | undefined;
  paid?: boolean | undefined;
}
export interface ChangePassword {
  password: string;
  newPassword: string;
}
export interface OrdersFieldFilterInput {
  name?: string | undefined;
  content?: string | undefined;
  clientId?: string | undefined;
  customFieldName?: string | undefined;
}
export interface OrdersFieldRegexFilterInput {
  name?: string | undefined;
  content?: string | undefined;
  clientId?: string | undefined;
  customFieldName?: string | undefined;
}
export interface SortOrdersInput {
  field: SortField;
  order?: boolean | undefined;
}
export interface DateFilterInput {
  dateFieldName?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}
export interface GetOAuthInput {
  scopes?: Array<string> | undefined;
  state?: string | undefined;
  redirectUri?: string | undefined;
}

export type Models = {
  ['Query']: {
    user: {
      args: Record<string, never>;
    };
    public: {
      args: Record<string, never>;
    };
    admin: {
      args: Record<string, never>;
    };
  };
  ['PublicQuery']: {
    login: {
      args: Record<string, never>;
    };
    list: {
      args: Record<string, never>;
    };
    calculateMyOrder: {
      args: {
        input?: CalculateOrderInput | undefined;
      };
    };
  };
  ['Mutation']: {
    public: {
      args: Record<string, never>;
    };
    user: {
      args: Record<string, never>;
    };
    admin: {
      args: Record<string, never>;
    };
    webhook: {
      args: Record<string, never>;
    };
  };
  ['PublicMutation']: {
    register: {
      args: {
        user: RegisterInput;
      };
    };
    changePasswordWithToken: {
      args: {
        token: ChangePasswordWithTokenInput;
      };
    };
    verifyEmail: {
      args: {
        verifyData: VerifyEmailInput;
      };
    };
  };
  ['UserMutation']: {
    editUser: {
      args: {
        updatedUser: UpdateUserInput;
      };
    };
    orderOps: {
      args: {
        _id: string;
      };
    };
    saveDraft: {
      args: {
        input: DraftOrderInput;
      };
    };
    sendOrder: {
      args: {
        input: SendOrderInput;
      };
    };
  };
  ['AdminMutation']: {
    addOrder: {
      args: {
        order?: CreateOrderAdminInput | undefined;
      };
    };
    orderOps: {
      args: {
        _id: string;
      };
    };
    sendInvoice: {
      args: Record<string, never>;
    };
  };
  ['UserQuery']: {
    me: {
      args: Record<string, never>;
    };
    calculateMyOrder: {
      args: {
        input?: CalculateOrderInput | undefined;
      };
    };
    myOrders: {
      args: Record<string, never>;
    };
    myDrafts: {
      args: Record<string, never>;
    };
    orderDetails: {
      args: {
        _id: string;
      };
    };
  };
  ['LoginQuery']: {
    password: {
      args: {
        user: LoginInput;
      };
    };
    provider: {
      args: {
        params: ProviderLoginInput;
      };
    };
    refreshToken: {
      args: {
        refreshToken: string;
      };
    };
    requestForForgotPassword: {
      args: {
        username: string;
      };
    };
    getGoogleOAuthLink: {
      args: {
        setup: GetOAuthInput;
      };
    };
  };
  ['AdminQuery']: {
    orders: {
      args: {
        fieldFilter?: AdminOrderFilter | undefined;
        dateFilter?: PeriodInput | undefined;
        paginate?: PageOptions | undefined;
        sort?: SortOrdersInput | undefined;
      };
    };
  };
  ['CountryPairsPrices']: {
    countryPair: {
      args: Record<string, never>;
    };
    prices: {
      args: Record<string, never>;
    };
  };
  ['PriceForCountryCurrency']: {
    country: {
      args: Record<string, never>;
    };
    price: {
      args: Record<string, never>;
    };
    unit: {
      args: Record<string, never>;
    };
  };
  ['User']: {
    _id: {
      args: Record<string, never>;
    };
    username: {
      args: Record<string, never>;
    };
    fullName: {
      args: Record<string, never>;
    };
    emailConfirmed: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    customerId: {
      args: Record<string, never>;
    };
  };
  ['Order']: {
    _id: {
      args: Record<string, never>;
    };
    clientId: {
      args: Record<string, never>;
    };
    direction: {
      args: Record<string, never>;
    };
    paymentFrom: {
      args: Record<string, never>;
    };
    units: {
      args: Record<string, never>;
    };
    from: {
      args: Record<string, never>;
    };
    to: {
      args: Record<string, never>;
    };
    deliveryType: {
      args: Record<string, never>;
    };
    ownerType: {
      args: Record<string, never>;
    };
    totalPrice: {
      args: Record<string, never>;
    };
    dimensions: {
      args: Record<string, never>;
    };
    description: {
      args: Record<string, never>;
    };
    notes: {
      args: Record<string, never>;
    };
    fromDoor: {
      args: Record<string, never>;
    };
    paid: {
      args: Record<string, never>;
    };
    toDoor: {
      args: Record<string, never>;
    };
  };
  ['DraftOrder']: {
    _id: {
      args: Record<string, never>;
    };
    clientId: {
      args: Record<string, never>;
    };
    direction: {
      args: Record<string, never>;
    };
    paymentFrom: {
      args: Record<string, never>;
    };
    units: {
      args: Record<string, never>;
    };
    from: {
      args: Record<string, never>;
    };
    to: {
      args: Record<string, never>;
    };
    deliveryType: {
      args: Record<string, never>;
    };
    ownerType: {
      args: Record<string, never>;
    };
    totalPrice: {
      args: Record<string, never>;
    };
    dimensions: {
      args: Record<string, never>;
    };
    description: {
      args: Record<string, never>;
    };
    notes: {
      args: Record<string, never>;
    };
    fromDoor: {
      args: Record<string, never>;
    };
    toDoor: {
      args: Record<string, never>;
    };
    paid: {
      args: Record<string, never>;
    };
  };
  ['Dimension']: {
    length: {
      args: Record<string, never>;
    };
    high: {
      args: Record<string, never>;
    };
    width: {
      args: Record<string, never>;
    };
    wight: {
      args: Record<string, never>;
    };
  };
  ['Address']: {
    country: {
      args: Record<string, never>;
    };
    flat: {
      args: Record<string, never>;
    };
    phone: {
      args: Record<string, never>;
    };
    addressGoogleString: {
      args: Record<string, never>;
    };
    person: {
      args: Record<string, never>;
    };
  };
  ['OrderOps']: {
    delete: {
      args: Record<string, never>;
    };
    update: {
      args: {
        input?: UpdateOrderInput | undefined;
      };
    };
  };
  ['ChangePasswordWithTokenResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['RegisterResponse']: {
    registered: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['VerifyEmailResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['LoginResponse']: {
    login: {
      args: Record<string, never>;
    };
    accessToken: {
      args: Record<string, never>;
    };
    refreshToken: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['OrderInvoice']: {
    address: {
      args: Record<string, never>;
    };
    cardCommission: {
      args: Record<string, never>;
    };
    clientPhoneNumber: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    deliveryPrice: {
      args: Record<string, never>;
    };
    id: {
      args: Record<string, never>;
    };
    invoiceId: {
      args: Record<string, never>;
    };
    orderId: {
      args: Record<string, never>;
    };
    pay: {
      args: Record<string, never>;
    };
    restaurant: {
      args: Record<string, never>;
    };
    total: {
      args: Record<string, never>;
    };
  };
  ['FileUpload']: {
    filename: {
      args: Record<string, never>;
    };
    uploadURL: {
      args: Record<string, never>;
    };
  };
  ['Pusher']: {
    authorization: {
      args: {
        socketId: string;
        channel: string;
      };
    };
    channels: {
      args: Record<string, never>;
    };
  };
  ['PusherAuth']: {
    auth: {
      args: Record<string, never>;
    };
  };
  ['PusherChannels']: {
    tenantOrders: {
      args: {
        id: unknown;
      };
    };
    driverOrders: {
      args: {
        id: unknown;
      };
    };
    driverStatus: {
      args: {
        id: unknown;
      };
    };
    restaurantOrders: {
      args: {
        id: unknown;
      };
    };
  };
  ['PaginatedOrders']: {
    cursorId: {
      args: Record<string, never>;
    };
    objects: {
      args: Record<string, never>;
    };
  };
  ['EditUserResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['ProviderLoginQuery']: {
    apple: {
      args: Record<string, never>;
    };
    google: {
      args: Record<string, never>;
    };
  };
  ['ProviderResponse']: {
    hasError: {
      args: Record<string, never>;
    };
    jwt: {
      args: Record<string, never>;
    };
    access_token: {
      args: Record<string, never>;
    };
  };
};
