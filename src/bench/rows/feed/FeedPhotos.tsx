import { Image } from "expo-image";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import { colors } from "@/theme/colors";

type FeedPhotosProps = {
  id: string;
  photos: number[];
};

export const FeedPhotos = ({ id, photos }: FeedPhotosProps) => {
  const { width } = useWindowDimensions();

  return (
    <View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ height: width }}>
        {photos.map((photo, page) => (
          <Image
            key={page}
            source={photo}
            recyclingKey={`${id}-${page}`}
            style={[styles.photo, { width, height: width }]}
          />
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {photos.map((_, page) => (
          <View key={page} style={[styles.dot, page === 0 && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  photo: {
    backgroundColor: colors.navy20,
  },
  dots: {
    height: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.navy20,
  },
  dotActive: {
    backgroundColor: colors.navy,
  },
});
