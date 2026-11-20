//
//  FocusBlockerBridge.m
//  DailyHabitApp
//
//  Objective-C React Native bridge export for FocusBlockerModule
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FocusBlockerModule, NSObject)

RCT_EXTERN_METHOD(requestFamilyControlsAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(activateShield:(NSString *)blockedTokensJSON
                  strictnessMode:(NSString *)strictnessMode
                  denyAppRemoval:(BOOL)denyAppRemoval
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deactivateShield:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setAntiUninstallGuard:(BOOL)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
