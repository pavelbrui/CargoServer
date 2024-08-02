import { FieldResolveInput } from 'stucco-js' 
import { FieldResolveInput as FieldResolveInput2 } from 'gei-crud/node_modules/stucco-js/lib/index.js';
import { Axolotl } from '@aexol/axolotl-core';
import { stuccoAdapter } from '@aexol/axolotl-stucco';
import { Models, OrderStatus } from './models.js'; 
import passSource from 'gei-basic/lib/Query/passSource.js';
import passSourceWithArgs from 'gei-basic/lib/Query/passSourceWithArgs.js';
import login from 'gei-users/lib/Query/login.js';
import register from 'gei-users/lib/Mutation/register.js';
import verifyEmail from 'gei-users/lib/Mutation/verifyEmail.js';
import password from 'gei-users/lib/LoginQuery/password.js';
import createObject from 'gei-crud/lib/Mutation/create.js';
import updateObject from 'gei-crud/lib/Mutation/update.js';
import deleteObject from 'gei-crud/lib/Mutation/deleteById.js';
import objects from 'gei-crud/lib/Query/objects.js';
import paginatedObjects from 'gei-crud/lib/Query/paginatedObjects.js';
import objectById from 'gei-crud/lib/Query/oneById.js';
import refreshToken from 'gei-users/lib/LoginQuery/refreshToken.js';
import mustBeUser from 'gei-users/lib/Query/mustBeUser.js';
import editUser from 'gei-users/lib/Mutation/editUser.js';
//import { MongOrb } from './orm.js';
//import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from 'gei-bookings/lib/utils/middleware.js';

//import {  updateNestedFields } from './utils.js';

import google from 'gei-users/lib/ProviderLoginQuery/google.js';
import provider from 'gei-users/lib/LoginQuery/provider.js';
import changePasswordWithToken from 'gei-users/lib/Mutation/changePasswordWithToken.js';
import getGoogleOAuthLink from 'gei-users/lib/Query/getGoogleOAuthLink.js';
import requestForForgotPassword from 'gei-users/lib/Query/requestForForgotPassword.js';


export const { applyMiddleware, createResolvers } = Axolotl(stuccoAdapter)<Models>({
  modelsPath: './src/models.ts',
  schemaPath: './schema.graphql',
});

const resolvers = createResolvers({
  Query: {
    user: mustBeUser,
    public: passSource,
    admin: mustBeUser,
  },
  Mutation: {
    admin: mustBeUser,
    public: passSource,
    user: mustBeUser,
  },
  PublicQuery: {
    // list:
    login,
  },
  LoginQuery: {
       password,
       refreshToken,
       provider,
       requestForForgotPassword,
       changePasswordWithToken,
       getGoogleOAuthLink,
     },
  ProviderLoginQuery: {
       google,
     },
  PublicMutation: {
    register,
    verifyEmail,
  },
  UserMutation: {
    editUser,
    orderOps: passSourceWithArgs,
    saveDraft: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection', addFields: [{name: 'clientId', value: (input.source as any)._id }, { name: 'status', value: OrderStatus.DRAFT}]  };
      return createObject({ ...(input as FieldResolveInput2), data }) ;
  },
	
    sendOrder: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection', addFields: [{name: 'clientId', value: (input.source as any)._id }, { name: 'status', value: OrderStatus.CREATED}] };
      const send = await createObject({ ...(input as FieldResolveInput2), data }) 
      return send;
      
  },
},
  OrderOps:  {
    update: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection' };
      console.log(input);
      
      return updateObject({ ...input as FieldResolveInput2, data }) ;
  },
    delete: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection' };
      return deleteObject({ ...input as FieldResolveInput2, data }) ;
  },
  },

  UserQuery: {
    me: mustBeUser,
	 // calculateMyOrder: 3,
    myOrders: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection' };
      return await objects({ ...input as FieldResolveInput2, data, arguments: { fieldFilter: { name: input.arguments?.name } } }) ;
    },
    myDrafts: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection' };
      return await objects({ ...input as FieldResolveInput2, data, arguments: { fieldFilter: { status: OrderStatus.DRAFT } } }) ;
    },
    orderDetails: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection' };
      return await objectById({ ...input as FieldResolveInput2, data })
    }
  },

  AdminMutation: {
    addOrder: async (input: FieldResolveInput) => {
      const data = { model: 'OrderCollection' };
      const create = await createObject({ ...(input as FieldResolveInput2), data }) 
      return !create;
  },
    //orderOps: true,
    //sendInvoice: true,


    // updateBooking: async (input: FieldResolveInput) =>
    //   errMiddleware(async () => {
    //     sourceContainUserIdOrThrow(input.source);
    //     const args = input.arguments?.input as any;
    //     if (args.addServiceIds) {
    //       const bookServices = await Promise.all(
    //         args?.addServiceIds?.map(
    //           async (serviceId: string) =>
    //             (
    //               await MongOrb('Services').collection.findOneAndUpdate(
    //                 { _id: serviceId, taken: { $ne: true } },
    //                 { $set: { taken: true } },
    //               )
    //             ).value || serviceId,
    //         ),
    //       );
    //       if (!bookServices[0])
    //         throw new GlobalError(`Services with _ids: ${args.removeServiceIds} is not find`, import.meta.url);
    //       const [bookedServices, busy] = [
    //         bookServices?.filter((s): s is ServiceModel => typeof s !== 'string'),
    //         bookServices?.filter((s): s is string => typeof s === 'string'),
    //       ];

    //       if (busy[0]) {
    //         if (bookedServices[0]) {
    //           await MongOrb('Services').collection.updateMany(
    //             { _id: { $in: bookedServices.map((s: any) => s._id) } },
    //             { $set: { taken: false } },
    //           );
    //         }
    //         throw new GlobalError(`Service is already taken: ${busy}`, import.meta.url);
    //       }
    //     }
    //     if (args.removeServiceIds) {
    //       const unlockServices = await Promise.all(
    //         args.removeServiceIds.map(
    //           async (serviceId: string) =>
    //             (
    //               await MongOrb('Services').collection.findOneAndUpdate(
    //                 { _id: serviceId, taken: { $ne: false } },
    //                 { $set: { taken: false } },
    //               )
    //             ).value || serviceId,
    //         ),
    //       );
    //       if (!unlockServices[0])
    //         throw new GlobalError(`Services with _ids: ${args.removeServiceIds} is not find`, import.meta.url);
    //       const [unlockedServices, alreadyFree] = [
    //         unlockServices.filter((s): s is ServiceModel => typeof s !== 'string'),
    //         unlockServices.filter((s): s is string => typeof s === 'string'),
    //       ];

    //       if (alreadyFree[0]) {
    //         if (unlockedServices[0]) {
    //           await MongOrb('Services').collection.updateMany(
    //             { _id: { $in: unlockedServices.map((s: any) => s._id) } },
    //             { $set: { taken: true } },
    //           );
    //         }
    //         throw new GlobalError(`Service is not booked: ${alreadyFree}`, import.meta.url);
    //       }
    //     }

    //     const comments =
    //       typeof args.comments === 'string' ? args.comments : updateNestedFields(args.comments, 'comments');

    //     const update = await MongOrb('Bookings').collection.findOneAndUpdate(
    //       { _id: args._id },
    //       {
    //         $set: { ...comments },
    //         ...(args.addServiceIds && { $push: { services: { $each: args.addServiceIds } } }),
    //         ...(args.removeServiceIds && { $pull: { services: { $each: args.removeServiceIds } } }),
    //       },
    //     );

    //     if (!update.ok) throw new GlobalError(`Nothing has been changed here`, import.meta.url);
    //     return { book: update.value };
    //   }),
    // removeBooking: async (input: FieldResolveInput) =>
    //   errMiddleware(async () => {
    //     sourceContainUserIdOrThrow(input.source);
    //     const args = input.arguments as { _id: string };
    //     const booking = await MongOrb('Bookings').collection.findOne({ _id: args._id });

    //     if (!booking || !booking.services)
    //       throw new GlobalError(`Booking not find for _id: ${args._id}`, import.meta.url);

    //     const removedServices = await MongOrb('Services').collection.updateMany(
    //       { _id: { $in: booking.services }, taken: { $ne: false } },
    //       { $set: { taken: false } },
    //     );
    //     if (removedServices.modifiedCount < 1)
    //       throw new GlobalError(`Service with _id: '${booking.services}' for this booking not find`, import.meta.url);

    //     const removeBook = await MongOrb('Bookings').collection.deleteOne({ _id: args._id });
    //     if (removeBook.deletedCount < 1) throw new GlobalError(`Booking has't been removed`, import.meta.url);
    //     return { removed: removeBook.deletedCount !== 0 };
    //   }),
  },
  AdminQuery:  {
  orders: async (input: FieldResolveInput) => {
    const data = { model: 'OrderCollection' };
    console.log(input);
    const paginatedOrders = await paginatedObjects({ ...input as FieldResolveInput2, data })
    return paginatedOrders ;
  },
}
});


export default async (input: any) => {
  applyMiddleware(
    resolvers,
    [
      (input) => {
        console.log('Run..........................................');
        return input;
      },
    ],
    {
      Query: { user: true },
      Mutation: { public: true },
      AdminMutation: {},
      UserQuery: {},
      PublicQuery: {},
      PublicMutation: {},
      LoginQuery: {},
    },
  );
  return stuccoAdapter(resolvers)(input);
};



