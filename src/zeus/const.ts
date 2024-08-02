/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	PublicQuery:{
		calculateMyOrder:{
			input:"CalculateOrderInput"
		}
	},
	PublicMutation:{
		register:{
			user:"RegisterInput"
		},
		changePasswordWithToken:{
			token:"ChangePasswordWithTokenInput"
		},
		verifyEmail:{
			verifyData:"VerifyEmailInput"
		}
	},
	UserMutation:{
		editUser:{
			updatedUser:"UpdateUserInput"
		},
		orderOps:{

		}
	},
	UpdateUserInput:{

	},
	AdminMutation:{
		addOrder:{
			order:"CreateOrderInput"
		},
		orderOps:{

		}
	},
	ProviderLoginInput:{

	},
	SimpleUserInput:{

	},
	LoginInput:{

	},
	SendTeamInvitationInput:{

	},
	VerifyEmailInput:{

	},
	InviteTokenInput:{

	},
	ChangePasswordWithTokenInput:{

	},
	ChangePasswordWhenLoggedInput:{

	},
	RegisterInput:{

	},
	UserQuery:{
		calculateMyOrder:{
			input:"CalculateOrderInput"
		},
		orderDetails:{

		}
	},
	CalculateOrderInput:{
		direction:"CountryPairs",
		paymentFrom:"CountryCurrency",
		unit:"Unit",
		DeliveryType:"DeliveryType",
		ownerType:"OwnerType",
		dimensions:"DimensionInput"
	},
	LoginQuery:{
		password:{
			user:"LoginInput"
		},
		provider:{
			params:"ProviderLoginInput"
		},
		refreshToken:{

		},
		requestForForgotPassword:{

		},
		getGoogleOAuthLink:{
			setup:"GetOAuthInput"
		}
	},
	AdminQuery:{
		orders:{
			fieldFilter:"OrdersFieldFilterInput",
			fieldRegexFilter:"OrdersFieldRegexFilterInput",
			dateFilter:"DateFilterInput",
			sort:"SortInput"
		}
	},
	CountryPairs: "enum" as const,
	CountryCurrency: "enum" as const,
	Unit: "enum" as const,
	DimensionInput:{

	},
	OwnerType: "enum" as const,
	DeliveryType: "enum" as const,
	Country: "enum" as const,
	OrderOps:{
		update:{
			input:"UpdateOrderInput"
		}
	},
	ChangePasswordWithTokenError: "enum" as const,
	UpdateOrderInput:{
		status:"OrderStatus",
		from:"AddressAddInput",
		to:"AddressAddInput",
		DeliveryType:"DeliveryType",
		ownerType:"OwnerType",
		addElements:"DimensionInput"
	},
	OrderStatus: "enum" as const,
	CreateOrderInput:{
		from:"AddressAddInput",
		to:"AddressAddInput",
		DeliveryType:"DeliveryType",
		ownerType:"OwnerType",
		elements:"DimensionInput"
	},
	AddressAddInput:{

	},
	Timestamp: `scalar.Timestamp` as const,
	TimestampFilter:{
		Gt:"Timestamp",
		Gte:"Timestamp",
		Lt:"Timestamp",
		Lte:"Timestamp"
	},
	AnyObject: `scalar.AnyObject` as const,
	SortInput:{
		field:"SortField"
	},
	SortField: "enum" as const,
	ProjectsFieldFilterInput:{

	},
	ProjectsFieldRegexFilterInput:{

	},
	RegisterErrors: "enum" as const,
	VerifyEmailError: "enum" as const,
	LoginErrors: "enum" as const,
	PeriodInput:{

	},
	PageOptions:{

	},
	AdminOrderFilter:{
		paymentFrom:"CountryCurrency",
		paginate:"PageOptions",
		sort:"SortOrdersInput",
		status:"OrderStatus"
	},
	Date: `scalar.Date` as const,
	ChangePassword:{

	},
	Platform: "enum" as const,
	Pusher:{
		authorization:{

		}
	},
	PusherChannels:{
		tenantOrders:{

		},
		driverOrders:{

		},
		driverStatus:{

		},
		restaurantOrders:{

		}
	},
	OrdersFieldFilterInput:{

	},
	OrderPriority: "enum" as const,
	OrdersFieldRegexFilterInput:{

	},
	SortOrdersInput:{
		field:"SortField"
	},
	DateFilterInput:{

	},
	EditUserError: "enum" as const,
	GetOAuthInput:{

	},
	ProviderErrors: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		user:"UserQuery",
		public:"PublicQuery",
		admin:"AdminQuery"
	},
	PublicQuery:{
		login:"LoginQuery",
		list:"String",
		calculateMyOrder:"Int"
	},
	Mutation:{
		public:"PublicMutation",
		user:"UserMutation",
		admin:"AdminMutation",
		webhook:"String"
	},
	PublicMutation:{
		register:"RegisterResponse",
		changePasswordWithToken:"ChangePasswordWithTokenResponse",
		verifyEmail:"VerifyEmailResponse"
	},
	UserMutation:{
		editUser:"EditUserResponse",
		orderOps:"OrderOps",
		sendOrder:"Boolean"
	},
	AdminMutation:{
		addOrder:"String",
		orderOps:"OrderOps",
		sendInvoice:"Boolean"
	},
	UserQuery:{
		me:"User",
		calculateMyOrder:"Int",
		myOrders:"String",
		orderDetails:"Order"
	},
	LoginQuery:{
		password:"LoginResponse",
		provider:"ProviderLoginQuery",
		refreshToken:"String",
		requestForForgotPassword:"Boolean",
		getGoogleOAuthLink:"String"
	},
	AdminQuery:{
		orders:"Order"
	},
	CountryPairsPrices:{
		countryPair:"CountryPairs",
		prices:"PriceForCountryCurrency"
	},
	PriceForCountryCurrency:{
		country:"CountryCurrency",
		price:"Float",
		unit:"Unit"
	},
	User:{
		_id:"String",
		username:"String",
		fullName:"String",
		emailConfirmed:"Boolean",
		createdAt:"String",
		customerId:"String"
	},
	Node:{
		"...on User": "User",
		_id:"String",
		createdAt:"String"
	},
	Order:{
		_id:"String",
		clientId:"String",
		direction:"CountryPairs",
		paymentFrom:"CountryCurrency",
		units:"Unit",
		from:"Address",
		to:"Address",
		DeliveryType:"DeliveryType",
		ownerType:"OwnerType",
		totalPrice:"Int",
		dimensions:"Dimension",
		fromDoor:"Boolean",
		toDoor:"Boolean"
	},
	DraftOrder:{
		_id:"String",
		clientId:"String",
		direction:"CountryPairs",
		paymentFrom:"CountryCurrency",
		units:"Unit",
		from:"Address",
		to:"Address",
		DeliveryType:"DeliveryType",
		ownerType:"OwnerType",
		totalPrice:"Int",
		dimensions:"Dimension",
		fromDoor:"Boolean",
		toDoor:"Boolean"
	},
	Dimension:{
		length:"Int",
		high:"Int",
		width:"Int",
		wight:"Int"
	},
	Address:{
		country:"Country",
		flat:"String",
		phone:"String",
		addressGoogleString:"String",
		person:"User"
	},
	OrderOps:{
		delete:"Boolean",
		update:"Boolean"
	},
	ChangePasswordWithTokenResponse:{
		result:"Boolean",
		hasError:"ChangePasswordWithTokenError"
	},
	Timestamp: `scalar.Timestamp` as const,
	AnyObject: `scalar.AnyObject` as const,
	RegisterResponse:{
		registered:"Boolean",
		hasError:"RegisterErrors"
	},
	VerifyEmailResponse:{
		result:"Boolean",
		hasError:"VerifyEmailError"
	},
	LoginResponse:{
		login:"String",
		accessToken:"String",
		refreshToken:"String",
		hasError:"LoginErrors"
	},
	OrderInvoice:{
		address:"Address",
		cardCommission:"Int",
		clientPhoneNumber:"String",
		createdAt:"Date",
		deliveryPrice:"Int",
		id:"String",
		invoiceId:"String",
		orderId:"String",
		pay:"Boolean",
		restaurant:"String",
		total:"Int"
	},
	Date: `scalar.Date` as const,
	FileUpload:{
		filename:"String",
		uploadURL:"String"
	},
	Pusher:{
		authorization:"PusherAuth",
		channels:"PusherChannels"
	},
	PusherAuth:{
		auth:"String"
	},
	PusherChannels:{
		tenantOrders:"String",
		driverOrders:"String",
		driverStatus:"String",
		restaurantOrders:"String"
	},
	EditUserResponse:{
		result:"Boolean",
		hasError:"EditUserError"
	},
	ProviderLoginQuery:{
		apple:"ProviderResponse",
		google:"ProviderResponse"
	},
	ProviderResponse:{
		hasError:"ProviderErrors",
		jwt:"String",
		access_token:"String"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}