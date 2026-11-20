//
//  FocusBlockerBridge.m
//  DailyHabitApp
//
//  Objective-C React Native bridge export for FocusBlockerModule
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FocusBlockerModule, NSObject)

RCT_EXTERN_METHOD(requestScreenTimeAuth:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(presentAppPicker:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startBlocking:(NSString *)tokensJSON
                  strictnessMode:(NSString *)strictnessMode
                  denyAppRemoval:(BOOL)denyAppRemoval
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopBlocking:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setAntiUninstallGuard:(BOOL)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
