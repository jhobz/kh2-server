/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type MultiMap = {
  /**
   * The name of the item.
   */
  name: string;
  /**
   * The location ID at which the item was collected.
   */
  location: string;
  /**
   * The ID of the player from which this item can be collected.
   */
  from: number;
  /**
   * The ID of the player to whom this item should be sent.
   */
  to: number;
}[];