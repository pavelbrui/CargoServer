import { MongoModel, iGraphQL } from 'i-graphql';
//import { ObjectId } from 'mongodb';
import { ModelTypes } from './zeus/index.js';

export type UserModel = MongoModel<ModelTypes['User']>;
export type OrderModel = MongoModel<ModelTypes['Order']>;
export type DraftOrderModel = MongoModel<ModelTypes['DraftOrder']>;
export type UserAuthModel = {
  _id: string;
  userId: string;
  salt?: string;
  passwordHash?: string;
  authorizationToken?: string;
  resetPasswordToken?: string;
  createdAt?: string;
  username?: string;
};

export type RefreshTokenModel = MongoModel<{
  _id: string;
  userId: string;
}>;

export type SocialModel = {
  _id: string;
  socialId: string;
  userId: string;
  createdAt: string;
};

const orm = async () => {
  return iGraphQL<
    {
      UserCollection: UserModel;
      OrderCollection: OrderModel;
      DraftOrderCollection: DraftOrderModel;
      RefreshTokenCollection: RefreshTokenModel;
      UserAuthorizationCollection: UserAuthModel;
      SocialCollection: SocialModel;
    },
    {
      createdAt: () => string;
      
    }
  >({
   
      
      createdAt: () => new Date().toISOString(),
  
    
  });
};

//export const coursorFind = async (col, filter, opts) => await orm().then((db) => db(col).collection.find(filter, opts));
export const MongOrb = await orm();
