import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FeedItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { RowProps } from "../types";

import { FeedActions } from "./FeedActions";
import { FeedComments } from "./FeedComments";
import { FeedHeader } from "./FeedHeader";
import { FeedPhotos } from "./FeedPhotos";
import { FeedTags } from "./FeedTags";
import { burnJs, HEAVY_RENDER_MS } from "./heavyCost";
import { StressGrid } from "./StressGrid";

export const FeedRow = memo(({ item, onLayout }: RowProps<FeedItem>) => {
  burnJs(HEAVY_RENDER_MS);

  return (
    <View style={styles.row} onLayout={onLayout}>
      <FeedHeader item={item} />
      <FeedPhotos id={item.id} photos={item.photos} />
      <FeedActions likes={item.likes} />
      <Text style={styles.caption} numberOfLines={4}>
        <Text style={styles.author}>{item.author.name} </Text>
        {item.caption}
      </Text>
      <FeedTags tags={item.tags} />
      <FeedComments id={item.id} comments={item.comments} />
      <Text style={styles.time}>{item.postedAt} ago</Text>
      <StressGrid />
    </View>
  );
});

FeedRow.displayName = "FeedRow";

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderBottomWidth: 6,
    borderBottomColor: colors.surface,
  },
  caption: {
    paddingHorizontal: 12,
    paddingTop: 6,
    fontSize: 14,
    lineHeight: 19,
    color: colors.navy,
  },
  author: {
    fontWeight: "700",
  },
  time: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    color: colors.navy60,
    textTransform: "uppercase",
  },
});
